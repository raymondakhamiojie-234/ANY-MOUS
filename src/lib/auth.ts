import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "any-mous-secret-token-key-32-chars-long-at-least"
);

const COOKIE_NAME = "anymous_session";

export interface SessionPayload {
  userId: string;
  username: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  try {
    let user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        email: true,
        promptText: true,
        isAcceptingMessages: true,
        blockedWords: true,
        isPro: true,
        proExpiresAt: true,
        paystackCustomerId: true,
        paystackSubscriptionCode: true,
        createdAt: true,
      },
    });

    // If ID changed (e.g. database re-seeded or migrated), look up by username or email
    if (!user && (session.username || session.email)) {
      user = await db.user.findFirst({
        where: {
          OR: [
            ...(session.username ? [{ username: session.username }] : []),
            ...(session.email ? [{ email: session.email }] : []),
          ],
        },
        select: {
          id: true,
          username: true,
          email: true,
          promptText: true,
          isAcceptingMessages: true,
          blockedWords: true,
          isPro: true,
          proExpiresAt: true,
          paystackCustomerId: true,
          paystackSubscriptionCode: true,
          createdAt: true,
        },
      });
    }

    if (user) return user;

    // Fallback using cryptographically verified JWT claims if record not found
    if (session.userId && session.username) {
      return {
        id: session.userId,
        username: session.username,
        email: session.email || `${session.username}@example.com`,
        promptText: "Send me an anonymous message!",
        isAcceptingMessages: true,
        blockedWords: "",
        isPro: false,
        proExpiresAt: null,
        paystackCustomerId: null,
        paystackSubscriptionCode: null,
        createdAt: new Date(),
      };
    }

    return null;
  } catch (err) {
    console.error("getCurrentUser error:", err);
    if (session.userId && session.username) {
      return {
        id: session.userId,
        username: session.username,
        email: session.email || `${session.username}@example.com`,
        promptText: "Send me an anonymous message!",
        isAcceptingMessages: true,
        blockedWords: "",
        isPro: false,
        proExpiresAt: null,
        paystackCustomerId: null,
        paystackSubscriptionCode: null,
        createdAt: new Date(),
      };
    }
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}
