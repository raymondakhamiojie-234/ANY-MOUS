"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Send, ShieldCheck, CheckCircle, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { DiceButton } from "@/components/DiceButton";
import Link from "next/link";

interface PublicMessageFormProps {
  username: string;
  promptText: string;
  isAcceptingMessages: boolean;
}

export function PublicMessageForm({
  username,
  promptText,
  isAcceptingMessages,
}: PublicMessageFormProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const maxLength = 500;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ec4899", "#f43f5e", "#8b5cf6", "#fbbf24"],
      });
    } catch {
      // Confetti fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          content: content.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSentSuccess(true);
      triggerConfetti();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setContent("");
    setSentSuccess(false);
    setErrorMsg("");
  };

  if (!isAcceptingMessages) {
    return (
      <div className="w-full glass-panel rounded-3xl p-6 text-center border border-amber-500/20 shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Messages Paused</h3>
        <p className="text-sm text-slate-300 mb-6">
          @{username} has currently turned off incoming anonymous messages. Check back later!
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 transition-all border border-white/10"
        >
          Create Your Own ANY-MOUS Link
        </Link>
      </div>
    );
  }

  if (sentSuccess) {
    return (
      <div className="w-full glass-panel rounded-3xl p-6 text-center border border-pink-500/30 shadow-2xl glass-card-glow animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 mb-4 animate-bounce">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-white mb-1">Sent Anonymously! 🎉</h3>
        <p className="text-sm text-slate-300 mb-6">
          Your message is now sitting safely in @{username}&apos;s secret inbox.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleReset}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 transition-all active:scale-[0.98] shadow-md shadow-pink-500/25"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Send Another Message</span>
          </button>

          <Link
            href="/register"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Get your own link (It&apos;s free!)</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl glass-card-glow">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 p-0.5 shadow-lg shadow-pink-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl font-black text-pink-400">
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px]" title="Accepting messages">
            ✓
          </span>
        </div>

        <h2 className="text-lg font-black text-white tracking-tight">
          @{username}
        </h2>
        <p className="mt-1 text-sm font-medium text-pink-300/90 max-w-xs">
          {promptText}
        </p>

        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 text-slate-300 border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Anonymous & Encrypted</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Textarea Container */}
        <div className="relative rounded-2xl bg-slate-950/70 border border-white/10 focus-within:border-pink-500/60 focus-within:ring-2 focus-within:ring-pink-500/20 transition-all p-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
            placeholder={`Say something secretly to @${username}...`}
            rows={4}
            disabled={sending}
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none resize-none leading-relaxed"
          />

          {/* Sub-bar with Dice & Char Counter */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
            <DiceButton
              onSelect={(icebreaker) => setContent(icebreaker)}
              currentValue={content}
              disabled={sending}
            />

            <span
              className={`text-[11px] font-medium ${
                content.length >= maxLength
                  ? "text-rose-400 font-bold"
                  : content.length > maxLength * 0.8
                  ? "text-amber-400"
                  : "text-slate-500"
              }`}
            >
              {content.length}/{maxLength}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-pink-500/25"
        >
          {sending ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending Anonymously...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
