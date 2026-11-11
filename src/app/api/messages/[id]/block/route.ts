import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const message = await db.message.findUnique({
      where: { id },
    });

    if (!message || message.recipientId !== user.id) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Add senderHash to recipient's BlockedSender list
    // The recipient never sees any identity, only the anonymous hash is blocked
    await db.blockedSender.upsert({
      where: {
        userId_senderHash: {
          userId: user.id,
          senderHash: message.senderHash,
        },
      },
      create: {
        userId: user.id,
        senderHash: message.senderHash,
      },
      update: {},
    });

    return NextResponse.json({
      success: true,
      message: "Sender has been blocked from sending you future messages.",
      senderHashBlocked: true,
    });
  } catch (error: any) {
    console.error("Block sender error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to block sender" },
      { status: 500 }
    );
  }
}
