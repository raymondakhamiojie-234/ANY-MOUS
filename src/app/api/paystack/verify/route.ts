import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    // Handle mock reference in dev mode
    if (reference.startsWith("mock_ref_")) {
      const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.user.update({
        where: { id: user.id },
        data: {
          isPro: true,
          proExpiresAt,
          paystackSubscriptionCode: "SUB_MOCK_PRO",
        },
      });
      return NextResponse.json({ success: true, verified: true, isPro: true });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Paystack secret key missing" }, { status: 500 });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (verifyData.status && verifyData.data.status === "success") {
      const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.user.update({
        where: { id: user.id },
        data: {
          isPro: true,
          proExpiresAt,
          paystackCustomerId: verifyData.data.customer?.customer_code || undefined,
          paystackSubscriptionCode:
            verifyData.data.subscription?.subscription_code ||
            verifyData.data.plan?.plan_code ||
            undefined,
        },
      });

      return NextResponse.json({ success: true, verified: true, isPro: true });
    }

    return NextResponse.json({ success: false, verified: false }, { status: 400 });
  } catch (error: any) {
    console.error("Paystack verify error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify transaction" },
      { status: 500 }
    );
  }
}
