import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSaltedFingerprint } from "@/lib/hash";
import { filterMessageContent } from "@/lib/content-filter";
import { extractSenderClues } from "@/lib/sender-clues";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, content } = body;

    if (!username || !content) {
      return NextResponse.json(
        { error: "Username and message content are required." },
        { status: 400 }
      );
    }

    const trimmedContent = String(content).trim();
    if (trimmedContent.length < 1) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 }
      );
    }

    if (trimmedContent.length > 500) {
      return NextResponse.json(
        { error: "Message exceeds 500 characters limit." },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { username: String(username).toLowerCase() },
      select: {
        id: true,
        username: true,
        isAcceptingMessages: true,
        blockedWords: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (!targetUser.isAcceptingMessages) {
      return NextResponse.json(
        {
          error: "This user is currently not accepting new anonymous messages.",
          code: "MESSAGES_PAUSED",
        },
        { status: 403 }
      );
    }

    // 1. Salted Fingerprinting: client IP + User-Agent + rotating daily salt hashed with SHA-256
    // Never store raw IP or raw User-Agent
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown-agent";
    const senderHash = getSaltedFingerprint(clientIp, userAgent);

    // 2. Blocklist Check: verify recipient hasn't blocked this senderHash
    const isSenderBlocked = await db.blockedSender.findUnique({
      where: {
        userId_senderHash: {
          userId: targetUser.id,
          senderHash,
        },
      },
    });

    if (isSenderBlocked) {
      return NextResponse.json(
        {
          error: "You have been blocked from sending messages to this user.",
          code: "SENDER_BLOCKED",
        },
        { status: 403 }
      );
    }

    // 3. Rate Limiting: Reject if senderHash sent >= 3 messages to this recipient within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentCount = await db.message.count({
      where: {
        recipientId: targetUser.id,
        senderHash,
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    if (recentCount >= 3) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. You can only send 3 messages per 5 minutes to this user.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // 4. Content Filter: Profanity & Per-User Blocked Words
    // Silently drops matching messages (returns success to avoid evasion, never stored)
    const filterResult = filterMessageContent(trimmedContent, targetUser.blockedWords);
    if (filterResult.blocked) {
      return NextResponse.json({
        success: true,
        messageId: "filtered",
        silentlyDropped: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Extract non-identifying sender clues (Device, Location, Network) for Pro recipients
    const clues = extractSenderClues(req.headers);

    // Insert approved anonymous message
    const message = await db.message.create({
      data: {
        recipientId: targetUser.id,
        content: trimmedContent,
        senderHash,
        senderLocation: clues.senderLocation,
        senderDevice: clues.senderDevice,
        senderNetwork: clues.senderNetwork,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: message.id,
      timestamp: message.createdAt,
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
