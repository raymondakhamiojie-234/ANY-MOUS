import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY || "";

    // Verify HMAC-SHA512 Paystack signature
    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    if (!signature || hash !== signature) {
      console.warn("Paystack webhook signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const data = event.data;

    console.log(`Paystack Webhook Received: [${eventType}]`);

    if (eventType === "charge.success") {
      const userId = data.metadata?.userId;
      const customerCode = data.customer?.customer_code;
      const subscriptionCode = data.subscription?.subscription_code || data.plan?.plan_code;
      const customerEmail = data.customer?.email?.toLowerCase();

      // Extend Pro for 30 days
      const proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (userId) {
        await db.user.update({
          where: { id: userId },
          data: {
            isPro: true,
            proExpiresAt,
            paystackCustomerId: customerCode || undefined,
            paystackSubscriptionCode: subscriptionCode || undefined,
          },
        });
        console.log(`Pro subscription enabled for user ID: ${userId}`);
      } else if (customerEmail) {
        await db.user.updateMany({
          where: { email: customerEmail },
          data: {
            isPro: true,
            proExpiresAt,
            paystackCustomerId: customerCode || undefined,
            paystackSubscriptionCode: subscriptionCode || undefined,
          },
        });
        console.log(`Pro subscription enabled for customer email: ${customerEmail}`);
      }
    } else if (
      eventType === "subscription.disable" ||
      eventType === "subscription.not_renew" ||
      eventType === "subscription.cancelled"
    ) {
      const subscriptionCode = data.subscription_code;
      const customerCode = data.customer?.customer_code;
      const customerEmail = data.customer?.email?.toLowerCase();

      if (subscriptionCode) {
        await db.user.updateMany({
          where: { paystackSubscriptionCode: subscriptionCode },
          data: { isPro: false },
        });
      } else if (customerCode) {
        await db.user.updateMany({
          where: { paystackCustomerId: customerCode },
          data: { isPro: false },
        });
      } else if (customerEmail) {
        await db.user.updateMany({
          where: { email: customerEmail },
          data: { isPro: false },
        });
      }
      console.log(`Pro subscription disabled for event: ${eventType}`);
    }

    // Always return 200 OK immediately to acknowledge receipt
    return new NextResponse("Webhook processed successfully", { status: 200 });
  } catch (error: any) {
    console.error("Paystack webhook error:", error);
    // Return 200 to prevent Paystack from endlessly retrying malformed hooks, while logging error
    return new NextResponse("Webhook error handled", { status: 200 });
  }
}
