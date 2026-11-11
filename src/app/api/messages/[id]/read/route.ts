import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
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

    const updated = await db.message.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update message" },
      { status: 500 }
    );
  }
}
