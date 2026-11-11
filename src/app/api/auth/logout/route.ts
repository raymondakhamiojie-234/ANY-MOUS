import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  const cookieOptions = getSessionCookieOptions();
  response.cookies.delete(cookieOptions.name);
  return response;
}
