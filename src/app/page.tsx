import React from "react";
import Link from "next/link";
import { MessageSquareText, Sparkles, ArrowRight, ShieldCheck, Dices, Share2, Heart, Flame } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start px-4 py-8 max-w-md mx-auto">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-pink-300 bg-pink-500/10 border border-pink-500/30 mb-6 shadow-sm shadow-pink-500/10 animate-pulse-subtle">
        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
        <span>The modern anonymous messaging app</span>
      </div>

      {/* Hero Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
          Find out what friends{" "}
          <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
            really think
          </span>{" "}
          about you
        </h1>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
          Get real confessions, honest feedback, and spicy compliments. 100% anonymous & encrypted.
        </p>
      </div>

      {/* Interactive Mock Preview Card (NGL Style) */}
      <div className="w-full rounded-3xl p-5 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 shadow-2xl relative overflow-hidden mb-8 glass-card-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
              ✨
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">@alex</p>
              <p className="text-[11px] text-white/80">Ask me anything, I won&apos;t know! 👀</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white">
            LIVE DEMO
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg text-slate-800 text-sm font-semibold mb-3">
          &quot;What&apos;s your honest first impression of me? 👀&quot;
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/90">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            100% Anonymous
          </span>
          <Link
            href="/u/alex"
            className="font-bold underline hover:text-white inline-flex items-center gap-1"
          >
            Try sending to @alex →
          </Link>
        </div>
      </div>

      {/* Primary CTAs */}
      <div className="w-full flex flex-col gap-3 mb-10">
        <Link
          href="/register"
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-base font-black text-white bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 active:scale-[0.98] transition-all shadow-xl shadow-pink-500/30"
        >
          <span>Get Your Free Link</span>
          <ArrowRight className="w-5 h-5" />
        </Link>

        <Link
          href="/u/alex"
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-sm font-bold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 active:scale-[0.98] transition-all"
        >
          <Dices className="w-4 h-4 text-pink-400" />
          <span>Test Public Profile (/u/alex)</span>
        </Link>
      </div>

      {/* How it Works Section */}
      <div className="w-full flex flex-col gap-3 mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          How it works
        </h2>

        <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center shrink-0 text-sm">
            1
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Claim your username</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sign up in 10 seconds to get your unique secret link.
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0 text-sm">
            2
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Share on IG / Snapchat</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Post your link to your story, bio, or group chat.
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-sm">
            3
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Read & reply to confessions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Get notified of incoming messages and export beautiful story cards to reply.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="w-full grid grid-cols-2 gap-2 text-center text-xs text-slate-400">
        <div className="glass-panel p-3 rounded-xl border border-white/5 flex items-center justify-center gap-1.5">
          <Dices className="w-4 h-4 text-pink-400" />
          <span>Icebreaker Dice</span>
        </div>
        <div className="glass-panel p-3 rounded-xl border border-white/5 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Anti-Spam Filter</span>
        </div>
      </div>
    </main>
  );
}
