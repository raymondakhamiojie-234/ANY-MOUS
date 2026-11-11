import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { parseSenderDevice, parseSenderLocation, parseSenderNetwork } from "../src/lib/sender-clues";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_mock_paystack_secret_key_12345";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details = "") {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName} ${details ? `(${details})` : ""}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runPaystackTests() {
  console.log("\n=======================================================");
  console.log("   ANY-MOUS: Paystack Subscription & Pro Clues Tests   ");
  console.log("=======================================================\n");

  // -----------------------------------------------------------------
  // 1. Sender Clues Parser Unit Tests
  // -----------------------------------------------------------------
  console.log("--- 1. Testing Sender Clues Extraction ---");
  const iphoneUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
  const androidUa = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36";
  const macUa = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

  assert(parseSenderDevice(iphoneUa).includes("iPhone"), "Parses iPhone device clue");
  assert(parseSenderDevice(androidUa).includes("Pixel") || parseSenderDevice(androidUa).includes("Android"), "Parses Android/Pixel device clue");
  assert(parseSenderDevice(macUa).includes("Mac"), "Parses Mac device clue");

  const headers = new Headers({
    "x-vercel-ip-city": "Lagos",
    "x-vercel-ip-country": "NG",
    "x-carrier": "MTN Nigeria",
  });
  assert(parseSenderLocation(headers) === "Lagos, NG", "Parses location from geo headers");
  assert(parseSenderNetwork(headers) === "MTN Nigeria", "Parses carrier network from carrier header");
  console.log("Sender clues tests passed.\n");

  // -----------------------------------------------------------------
  // 2. Paystack Webhook HMAC-SHA512 Signature & Event Tests
  // -----------------------------------------------------------------
  console.log("--- 2. Testing Paystack Webhook Handler ---");
  const targetUser = await prisma.user.findUnique({ where: { username: "alex" } });
  if (!targetUser) throw new Error("Target user 'alex' not found");

  // Reset alex isPro to false initially
  await prisma.user.update({
    where: { id: targetUser.id },
    data: { isPro: false, proExpiresAt: null },
  });

  // A. Test Invalid Signature Rejection
  const dummyPayload = JSON.stringify({ event: "charge.success", data: {} });
  const badSigRes = await fetch(`${BASE_URL}/api/paystack/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": "invalid_fake_signature_hex",
    },
    body: dummyPayload,
  });
  assert(badSigRes.status === 400, "Webhook rejects invalid HMAC signature with HTTP 400");

  // B. Test Valid 'charge.success' Event
  const chargeSuccessPayload = JSON.stringify({
    event: "charge.success",
    data: {
      id: 99887766,
      reference: `ref_test_${Date.now()}`,
      amount: 250000,
      customer: {
        customer_code: "CUS_test_alex_123",
        email: targetUser.email,
      },
      subscription: {
        subscription_code: "SUB_test_code_999",
      },
      metadata: {
        userId: targetUser.id,
        username: targetUser.username,
      },
    },
  });

  const validChargeSig = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(chargeSuccessPayload)
    .digest("hex");

  const webhookChargeRes = await fetch(`${BASE_URL}/api/paystack/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": validChargeSig,
    },
    body: chargeSuccessPayload,
  });

  assert(webhookChargeRes.status === 200, "Webhook acknowledges charge.success with HTTP 200");

  // Verify alex is now Pro in database
  const updatedUser = await prisma.user.findUnique({ where: { id: targetUser.id } });
  assert(updatedUser?.isPro === true, "User isPro updated to TRUE upon charge.success");
  assert(
    updatedUser?.proExpiresAt !== null && new Date(updatedUser!.proExpiresAt!).getTime() > Date.now(),
    "User proExpiresAt extended into the future (30 days)"
  );
  assert(updatedUser?.paystackCustomerId === "CUS_test_alex_123", "Recorded paystackCustomerId");
  console.log("charge.success webhook tests passed.\n");

  // C. Test 'subscription.disable' Event
  console.log("--- 3. Testing Subscription Cancellation Webhook ---");
  const disablePayload = JSON.stringify({
    event: "subscription.disable",
    data: {
      subscription_code: "SUB_test_code_999",
      customer: {
        customer_code: "CUS_test_alex_123",
        email: targetUser.email,
      },
    },
  });

  const validDisableSig = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(disablePayload)
    .digest("hex");

  const webhookDisableRes = await fetch(`${BASE_URL}/api/paystack/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": validDisableSig,
    },
    body: disablePayload,
  });

  assert(webhookDisableRes.status === 200, "Webhook acknowledges subscription.disable with HTTP 200");

  // Verify alex is now reverted to isPro: false
  const revertedUser = await prisma.user.findUnique({ where: { id: targetUser.id } });
  assert(revertedUser?.isPro === false, "User isPro successfully reverted to FALSE upon cancellation");
  console.log("subscription.disable webhook tests passed.\n");

  // -----------------------------------------------------------------
  // 4. Paystack Initialize Endpoint Verification
  // -----------------------------------------------------------------
  console.log("--- 4. Testing Paystack Initialize Endpoint ---");
  // Unauthorized check
  const unauthInitRes = await fetch(`${BASE_URL}/api/paystack/initialize`, { method: "POST" });
  assert(unauthInitRes.status === 401, "Initialize endpoint rejects unauthenticated requests with HTTP 401");

  console.log("=======================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} PAYSTACK TESTS PASSED!`);
  console.log("=======================================================\n");
}

runPaystackTests()
  .catch((err) => {
    console.error("Paystack test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
