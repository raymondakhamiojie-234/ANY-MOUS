import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // Upsert demo user 'alex'
  const alex = await prisma.user.upsert({
    where: { username: "alex" },
    update: {
      passwordHash,
      promptText: "Ask me anything, I won't know who you are! 👀",
      isAcceptingMessages: true,
      isPro: false,
    },
    create: {
      username: "alex",
      email: "alex@example.com",
      passwordHash,
      promptText: "Ask me anything, I won't know who you are! 👀",
      isAcceptingMessages: true,
      isPro: false,
    },
  });

  console.log("Demo user seeded:", alex.username);

  // Clear existing messages for clean seed
  await prisma.message.deleteMany({
    where: { recipientId: alex.id },
  });

  const demoMessages = [
    {
      content: "What's your honest first impression of me? 👀",
      senderHash: "seed-hash-1",
      senderLocation: "Lagos, NG",
      senderDevice: "iPhone 14 (iOS 17)",
      senderNetwork: "MTN Nigeria (5G)",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    },
    {
      content: "You always have the best energy in the room! Never change ✨",
      senderHash: "seed-hash-2",
      senderLocation: "Abuja, NG",
      senderDevice: "Samsung Galaxy S24",
      senderNetwork: "Airtel 5G Cellular",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    },
    {
      content: "What song immediately reminds you of me? 🎵 I bet it's something cheesy!",
      senderHash: "seed-hash-3",
      senderLocation: "London, UK",
      senderDevice: "iPhone 15 Pro",
      senderNetwork: "Broadband WiFi",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    },
    {
      content: "Secret confession: I was terrified to talk to you when we first met lol",
      senderHash: "seed-hash-4",
      senderLocation: "Port Harcourt, NG",
      senderDevice: "MacBook Air (macOS)",
      senderNetwork: "Glo 4G LTE",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ];

  for (const msg of demoMessages) {
    await prisma.message.create({
      data: {
        recipientId: alex.id,
        content: msg.content,
        senderHash: msg.senderHash,
        senderLocation: msg.senderLocation,
        senderDevice: msg.senderDevice,
        senderNetwork: msg.senderNetwork,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      },
    });
  }

  console.log(`Seeded ${demoMessages.length} sample messages for alex with sender clues.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
