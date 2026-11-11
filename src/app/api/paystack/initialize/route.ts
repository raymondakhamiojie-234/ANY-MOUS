import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    let user = await getCurrentUser();

    // If not authenticated via session cookie, check if email was passed in request body
    if (!user) {
      try {
        const body = await req.json();
        if (body?.email) {
          const cleanEmail = String(body.email).trim().toLowerCase();
          const found = await db.user.findUnique({
            where: { email: cleanEmail },
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
          if (found) {
            user = found;
          }
        }
      } catch {
        // Body was empty or not JSON
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized. Please sign in or provide your account email to upgrade to Pro.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const planCode = process.env.PAYSTACK_PLAN_CODE;

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
    const callback_url = `${baseUrl}/dashboard?payment=success`;

    // If using a simulated mock key in local development/tests, return a mock authorization URL
    if (!secretKey || secretKey.startsWith("sk_test_mock")) {
      const mockRef = `mock_ref_${user.id}_${Date.now()}`;
      return NextResponse.json({
        success: true,
        authorization_url: `${callback_url}&reference=${mockRef}`,
        reference: mockRef,
        isMock: true,
      });
    }

    // Call live Paystack API
    const paystackPayload: Record<string, any> = {
      email: user.email,
      amount: 250000, // 2,500 NGN (in kobo) default recurring plan amount
      callback_url,
      metadata: {
        userId: user.id,
        username: user.username,
      },
    };

    if (planCode && !planCode.startsWith("PLN_test_anymous")) {
      paystackPayload.plan = planCode;
    }

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const data = await paystackRes.json();

    if (!paystackRes.ok || !data.status) {
      console.error("Paystack upstream error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to initialize Paystack transaction." },
        { status: paystackRes.status === 401 ? 502 : (paystackRes.status || 400) }
      );
    }

    return NextResponse.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
    });
  } catch (error: any) {
    console.error("Paystack initialize error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error initializing payment." },
      { status: 500 }
    );
  }
}
