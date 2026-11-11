import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const dataToUpdate: {
      isAcceptingMessages?: boolean;
      promptText?: string;
      blockedWords?: string;
    } = {};

    if (typeof body.isAcceptingMessages === "boolean") {
      dataToUpdate.isAcceptingMessages = body.isAcceptingMessages;
    }

    if (typeof body.promptText === "string") {
      const trimmedPrompt = body.promptText.trim();
      if (trimmedPrompt.length > 120) {
        return NextResponse.json(
          { error: "Prompt text cannot exceed 120 characters." },
          { status: 400 }
        );
      }
      dataToUpdate.promptText = trimmedPrompt || "Send me an anonymous message!";
    }

    if (typeof body.blockedWords === "string") {
      // Clean and normalize comma/newline separated words
      const cleanedWords = body.blockedWords
        .split(/[,;\n]+/)
        .map((w: string) => w.trim().toLowerCase())
        .filter((w: string) => w.length > 0)
        .join(", ");

      if (cleanedWords.length > 1000) {
        return NextResponse.json(
          { error: "Blocked words list is too long." },
          { status: 400 }
        );
      }
      dataToUpdate.blockedWords = cleanedWords;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "No valid settings provided." }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        email: true,
        promptText: true,
        isAcceptingMessages: true,
        blockedWords: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
