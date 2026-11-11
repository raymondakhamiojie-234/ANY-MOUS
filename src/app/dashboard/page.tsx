import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | ANY-MOUS",
  description: "View and manage your anonymous messages",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all messages for the current user, ordered by newest first
  const messages = await db.message.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      senderHash: true,
      senderLocation: true,
      senderDevice: true,
      senderNetwork: true,
      isRead: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <DashboardClient
        initialUser={{
          id: user.id,
          username: user.username,
          email: user.email,
          promptText: user.promptText,
          isAcceptingMessages: user.isAcceptingMessages,
          blockedWords: user.blockedWords,
          isPro: user.isPro,
          proExpiresAt: user.proExpiresAt ? user.proExpiresAt.toISOString() : null,
        }}
        initialMessages={messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
