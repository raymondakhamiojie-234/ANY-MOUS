import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Send an anonymous message on ANY-MOUS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const cleanUsername = username.toLowerCase();

  let prompt = "Send me an anonymous message! 👀";
  try {
    const user = await db.user.findUnique({
      where: { username: cleanUsername },
      select: { promptText: true },
    });
    if (user?.promptText) {
      prompt = user.promptText;
    }
  } catch {
    // Graceful fallback when DATABASE_URL is not yet connected or during build
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f0c20 0%, #271033 50%, #1a0826 100%)",
          color: "white",
          padding: "50px 60px",
          position: "relative",
        }}
      >
        {/* Glow ambient background elements */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "-100px",
            width: "400px",
            height: "400px",
            background: "rgba(236, 72, 153, 0.25)",
            borderRadius: "50%",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-100px",
            width: "450px",
            height: "450px",
            background: "rgba(139, 92, 246, 0.25)",
            borderRadius: "50%",
            display: "flex",
          }}
        />

        {/* Top Branding Pill */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.08)",
            padding: "10px 24px",
            borderRadius: "9999px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <span style={{ fontSize: "20px", marginRight: "10px" }}>💬</span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 800,
              letterSpacing: "2px",
              color: "#f472b6",
              textTransform: "uppercase",
            }}
          >
            ANY-MOUS • Secret Q&A
          </span>
        </div>

        {/* Center Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.06)",
            border: "2px solid rgba(244, 114, 182, 0.35)",
            borderRadius: "32px",
            padding: "40px 60px",
            maxWidth: "920px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #ec4899, #f43f5e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: 900,
                color: "white",
                marginRight: "16px",
              }}
            >
              {cleanUsername.charAt(0).toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                }}
              >
                Send @{cleanUsername} an anonymous message!
              </span>
              <span style={{ fontSize: "16px", color: "#94a3b8", fontWeight: 600 }}>
                100% Anonymous & Encrypted
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              color: "#0f172a",
              borderRadius: "20px",
              padding: "24px 36px",
              fontSize: "26px",
              fontWeight: 800,
              textAlign: "center",
              maxWidth: "800px",
            }}
          >
            &quot;{prompt}&quot;
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: "920px",
            fontSize: "18px",
            color: "#cbd5e1",
            fontWeight: 700,
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <span>🔒 Safe, private & anonymous confessions</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(244, 63, 94, 0.2)",
              color: "#fda4af",
              padding: "6px 20px",
              borderRadius: "9999px",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              fontSize: "16px",
            }}
          >
            any-mous.me/u/{cleanUsername}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
