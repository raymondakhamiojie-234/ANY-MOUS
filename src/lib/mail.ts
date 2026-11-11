import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || "ANY-MOUS <onboarding@resend.dev>";

export async function sendPasswordResetEmail({
  to,
  username,
  resetUrl,
}: {
  to: string;
  username: string;
  resetUrl: string;
}): Promise<{ success: boolean; mode: "resend" | "dev_console" }> {
  if (resend) {
    try {
      await resend.emails.send({
        from: fromEmail,
        to,
        subject: "Reset your ANY-MOUS Password",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0f0c20; color: #ffffff; border-radius: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #f472b6; font-size: 24px; font-weight: 800; margin: 0;">ANY-MOUS</h1>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
            </div>
            
            <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6;">Hi <strong>@${username}</strong>,</p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              We received a request to reset your password. Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #f43f5e); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);">
                Reset My Password
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px;">
              If you did not request this, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
        `,
      });
      return { success: true, mode: "resend" };
    } catch (error) {
      console.error("Resend email failed, falling back to console logger:", error);
    }
  }

  // Development fallback: Log reset URL to terminal
  console.log("\n=======================================================");
  console.log("🔑 [DEV MODE: PASSWORD RESET EMAIL SIMULATION]");
  console.log(`Recipient: ${to} (@${username})`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log("=======================================================\n");

  return { success: true, mode: "dev_console" };
}
