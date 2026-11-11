import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PublicMessageForm } from "@/components/PublicMessageForm";
import Link from "next/link";
import { MessageSquareText, Sparkles, UserX } from "lucide-react";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: ProfilePageProps) {
  const { username } = await props.params;
  const cleanUsername = username.toLowerCase();

  let user = null;
  try {
    user = await db.user.findUnique({
      where: { username: cleanUsername },
      select: { username: true, promptText: true },
    });
  } catch {
    // Graceful fallback during build / db connection
  }

  if (!user) {
    return {
      title: "User Not Found - ANY-MOUS",
      description: "This anonymous profile could not be found.",
    };
  }

  const title = `Send @${user.username} an anonymous message!`;
  const description =
    user.promptText || "Ask me anything, I won't know who you are! 100% anonymous & encrypted.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: "ANY-MOUS",
      url: `/u/${user.username}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicProfilePage(props: ProfilePageProps) {
  const { username } = await props.params;
  const cleanUsername = username.toLowerCase();

  const user = await db.user.findUnique({
    where: { username: cleanUsername },
    select: {
      id: true,
      username: true,
      promptText: true,
      isAcceptingMessages: true,
    },
  });

  if (!user) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm glass-panel rounded-3xl p-8 text-center border border-white/10 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
            <UserX className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-white mb-2">User Not Found</h1>
          <p className="text-sm text-slate-300 mb-6">
            The user <span className="font-bold text-pink-400">@{username}</span> doesn&apos;t seem to exist on ANY-MOUS yet.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/register"
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all shadow-md shadow-pink-500/20"
            >
              Claim @{username} Now
            </Link>
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        {/* Profile Card with interactive Form */}
        <PublicMessageForm
          username={user.username}
          promptText={user.promptText}
          isAcceptingMessages={user.isAcceptingMessages}
        />

        {/* Footer info & CTA */}
        <div className="flex flex-col items-center text-center gap-2">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Want your own anonymous Q&A link?</span>
          </Link>
          <span className="text-[11px] text-slate-500 font-medium">
            Join thousands having fun on ANY-MOUS
          </span>
        </div>
      </div>
    </main>
  );
}
