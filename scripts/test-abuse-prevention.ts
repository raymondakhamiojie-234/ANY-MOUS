import { PrismaClient } from "@prisma/client";
import { getSaltedFingerprint, getDailySalt } from "../src/lib/hash";
import {
  containsGlobalProfanity,
  containsUserBlockedWords,
  filterMessageContent,
} from "../src/lib/content-filter";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

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

async function runTests() {
  console.log("\n=======================================================");
  console.log("   ANY-MOUS: Abuse Prevention & Anonymity Test Suite   ");
  console.log("=======================================================\n");

  // -----------------------------------------------------------------
  // 1. Salted Fingerprinting Tests
  // -----------------------------------------------------------------
  console.log("--- 1. Testing Salted Fingerprinting ---");
  const ip1 = "192.168.1.100";
  const ip2 = "192.168.1.101";
  const ua1 = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
  const ua2 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

  const hash1 = getSaltedFingerprint(ip1, ua1);
  const hash2 = getSaltedFingerprint(ip2, ua1);
  const hash3 = getSaltedFingerprint(ip1, ua2);

  assert(typeof hash1 === "string" && hash1.length === 64, "Hash is 64-character SHA-256 hex");
  assert(hash1 !== hash2, "Different IPs produce different senderHashes");
  assert(hash1 !== hash3, "Different User-Agents produce different senderHashes");
  assert(!hash1.includes(ip1) && !hash1.includes("iPhone"), "Raw IP and User-Agent are not stored or leaked");

  const saltDay1 = getDailySalt("2026-11-10");
  const saltDay2 = getDailySalt("2026-11-11");
  assert(saltDay1 !== saltDay2, "Daily salt rotates based on date");
  console.log("Fingerprinting tests passed.\n");

  // -----------------------------------------------------------------
  // 2. Content Filter Unit Tests
  // -----------------------------------------------------------------
  console.log("--- 2. Testing Content Filter & Blocked Words ---");
  assert(containsGlobalProfanity("You are an asshole") === true, "Flags direct profanity");
  assert(containsGlobalProfanity("what a b!tch move") === true, "Flags leetspeak obfuscated profanity");
  assert(containsGlobalProfanity("f.u.c.k this") === true, "Flags dot-separated profanity");
  assert(containsGlobalProfanity("Hello, what is your favorite hobby?") === false, "Passes benign message");
  assert(containsGlobalProfanity("The classic movie was great") === false, "Avoids false positives (classic)");

  // Per-user custom blocked words
  const userBlockedSetting = "crypto, promo, ugly, scam";
  assert(containsUserBlockedWords("check out this crypto link", userBlockedSetting) === true, "Flags user blocked word: crypto");
  assert(containsUserBlockedWords("Hey you are UGLY", userBlockedSetting) === true, "Flags case-insensitive blocked word: UGLY");
  assert(containsUserBlockedWords("I love your fashion style!", userBlockedSetting) === false, "Passes benign message against blocked words");

  const combinedCheck = filterMessageContent("buy this scam coin", userBlockedSetting);
  assert(combinedCheck.blocked === true, "Combined filter flags blocked word");
  console.log("Content filter unit tests passed.\n");

  // -----------------------------------------------------------------
  // 3. Rate Limiter Automated API Test (Max 3 messages per 5 minutes)
  // -----------------------------------------------------------------
  console.log("--- 3. Testing Rate Limiting (API /api/messages/send) ---");
  const testUsername = "alex";
  const rateLimitTestIp = "10.0.0.99";
  const rateLimitTestUa = "RateLimitTestAgent/1.0";
  const testSenderHash = getSaltedFingerprint(rateLimitTestIp, rateLimitTestUa);

  // Clean any previous test messages for this senderHash
  const targetUser = await prisma.user.findUnique({ where: { username: testUsername } });
  if (!targetUser) throw new Error("Target user 'alex' not found");

  await prisma.message.deleteMany({
    where: { recipientId: targetUser.id, senderHash: testSenderHash },
  });

  async function sendMessage(content: string, ip: string, ua: string) {
    const res = await fetch(`${BASE_URL}/api/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
        "user-agent": ua,
      },
      body: JSON.stringify({ username: testUsername, content }),
    });
    const data = await res.json();
    return { status: res.status, data };
  }

  // Send message 1 -> should succeed
  const r1 = await sendMessage("Rate test message 1", rateLimitTestIp, rateLimitTestUa);
  assert(r1.status === 200 && r1.data.success === true, "Message 1 sent successfully (HTTP 200)");

  // Send message 2 -> should succeed
  const r2 = await sendMessage("Rate test message 2", rateLimitTestIp, rateLimitTestUa);
  assert(r2.status === 200 && r2.data.success === true, "Message 2 sent successfully (HTTP 200)");

  // Send message 3 -> should succeed
  const r3 = await sendMessage("Rate test message 3", rateLimitTestIp, rateLimitTestUa);
  assert(r3.status === 200 && r3.data.success === true, "Message 3 sent successfully (HTTP 200)");

  // Send message 4 (exceeds limit of 3 per 5 min) -> MUST be rejected with HTTP 429
  const r4 = await sendMessage("Rate test message 4 (Should be blocked)", rateLimitTestIp, rateLimitTestUa);
  assert(r4.status === 429, "Message 4 rejected with HTTP 429 Rate Limit Exceeded");
  assert(r4.data.code === "RATE_LIMIT_EXCEEDED", "Returns code 'RATE_LIMIT_EXCEEDED'");

  // Verify only 3 messages exist in database
  const dbCount = await prisma.message.count({
    where: { recipientId: targetUser.id, senderHash: testSenderHash },
  });
  assert(dbCount === 3, `Database strictly contains only the 3 permitted messages (got ${dbCount})`);
  console.log("Rate limiter tests passed.\n");

  // -----------------------------------------------------------------
  // 4. Content Filter Silent Drop Automated API Test
  // -----------------------------------------------------------------
  console.log("--- 4. Testing Content Filter Silent Drop (API /api/messages/send) ---");
  // Update alex's blockedWords to include 'scamlink'
  await prisma.user.update({
    where: { id: targetUser.id },
    data: { blockedWords: "scamlink, badpromo" },
  });

  const filterTestIp = "10.0.0.101";
  const filterTestUa = "FilterTestAgent/1.0";
  const filterSenderHash = getSaltedFingerprint(filterTestIp, filterTestUa);

  await prisma.message.deleteMany({
    where: { recipientId: targetUser.id, senderHash: filterSenderHash },
  });

  // Send message containing blocked word
  const silentDropRes = await sendMessage("Check this scamlink now!", filterTestIp, filterTestUa);
  assert(silentDropRes.status === 200, "Returns HTTP 200 to sender for stealth");
  assert(silentDropRes.data.silentlyDropped === true, "API response marks silentlyDropped = true");

  // Verify message is NOT stored in DB
  const droppedInDb = await prisma.message.findFirst({
    where: { recipientId: targetUser.id, senderHash: filterSenderHash },
  });
  assert(droppedInDb === null, "Silently dropped message was NOT saved in database");
  console.log("Content filter silent drop tests passed.\n");

  // -----------------------------------------------------------------
  // 5. Block Sender & Blocklist Automated API Test
  // -----------------------------------------------------------------
  console.log("--- 5. Testing Block Sender & Blocklist Enforcement ---");
  const abusiveSenderIp = "10.0.0.150";
  const abusiveSenderUa = "AbusiveSenderAgent/1.0";
  const abusiveHash = getSaltedFingerprint(abusiveSenderIp, abusiveSenderUa);

  // Clean previous state
  await prisma.blockedSender.deleteMany({
    where: { userId: targetUser.id, senderHash: abusiveHash },
  });
  await prisma.message.deleteMany({
    where: { recipientId: targetUser.id, senderHash: abusiveHash },
  });

  // Step 1: Abusive sender sends a message
  const msgRes = await sendMessage("I am going to bother you", abusiveSenderIp, abusiveSenderUa);
  assert(msgRes.status === 200, "Initial message sent before block");

  // Step 2: Target user 'alex' blocks the sender of this message
  await prisma.blockedSender.create({
    data: {
      userId: targetUser.id,
      senderHash: abusiveHash,
    },
  });

  const isBlockedInDb = await prisma.blockedSender.findUnique({
    where: { userId_senderHash: { userId: targetUser.id, senderHash: abusiveHash } },
  });
  assert(isBlockedInDb !== null, "Sender hash added to BlockedSender table");

  // Step 3: Same abusive sender attempts to send a new message
  const blockedAttemptRes = await sendMessage("You cannot stop me!", abusiveSenderIp, abusiveSenderUa);
  assert(blockedAttemptRes.status === 403, "Blocked sender rejected with HTTP 403 Forbidden");
  assert(blockedAttemptRes.data.code === "SENDER_BLOCKED", "Returns code 'SENDER_BLOCKED'");

  // Step 4: Verify blocked message was NOT saved
  const blockedMsgInDb = await prisma.message.findFirst({
    where: { recipientId: targetUser.id, content: "You cannot stop me!" },
  });
  assert(blockedMsgInDb === null, "Blocked message was NOT written to database");

  // Step 5: A different sender is NOT affected
  const innocentSenderRes = await sendMessage(
    "Hello from another friend! ✨",
    "10.0.0.188",
    "InnocentAgent/1.0"
  );
  assert(innocentSenderRes.status === 200, "Different sender is not blocked and succeeds");

  console.log("Blocklist automated tests passed.\n");

  console.log("=======================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log("=======================================================\n");
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
