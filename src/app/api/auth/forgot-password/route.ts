import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const result = forgotPasswordSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const email = result.data.email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true },
    });

    if (user) {
      // Generate secure 64-char token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Clean up previous tokens
      await db.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Save token
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // Compute base URL
      const forwardedHost = req.headers.get("x-forwarded-host");
      const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
      const origin = req.headers.get("origin");
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        origin ||
        (forwardedHost ? `${forwardedProto}://${forwardedHost}` : "http://localhost:3000");

      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail({
        to: user.email,
        username: user.username,
        resetUrl,
      });
    }

    // Stealth response to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account is associated with that email, we have sent a password reset link.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request." },
      { status: 500 }
    );
  }
}
