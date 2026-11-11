import crypto from "crypto";

/**
 * Computes a privacy-preserving salted fingerprint for anonymous senders.
 * Never stores raw IP or user-agent strings.
 * Combines client IP, User-Agent, and a rotating daily salt hashed with SHA-256.
 */
export function getDailySalt(dateStr?: string): string {
  const secret = process.env.DAILY_SALT_SECRET || process.env.JWT_SECRET || "daily-salt-secret-key-2026";
  const date = dateStr || new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return crypto.createHmac("sha256", secret).update(`daily-salt-${date}`).digest("hex");
}

export function getSaltedFingerprint(
  clientIp: string,
  userAgent: string = "unknown-agent",
  dateStr?: string
): string {
  const dailySalt = getDailySalt(dateStr);
  const normalizedIp = (clientIp || "127.0.0.1").trim();
  const normalizedUa = (userAgent || "unknown-agent").trim();

  // Combine client IP + User-Agent + daily salt
  const combined = `${normalizedIp}::${normalizedUa}::${dailySalt}`;

  return crypto
    .createHash("sha256")
    .update(combined)
    .digest("hex");
}

// Backward-compatible alias for existing imports
export const getSenderHash = getSaltedFingerprint;
