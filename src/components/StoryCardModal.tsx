"use client";

import React, { useState } from "react";
import { X, Copy, Check, Download, Share2 } from "lucide-react";

interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  username: string;
  promptText: string;
}

export function StoryCardModal({
  isOpen,
  onClose,
  messageContent,
  username,
  promptText,
}: StoryCardModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(`"${messageContent}" — Anonymous message received on ANY-MOUS`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 p-5 shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-sm font-semibold tracking-wide uppercase text-pink-400 mb-4">
          Instagram / Snapchat Story Card
        </h3>

        {/* NGL Style Story Card Preview */}
        <div
          id="story-card"
          className="w-full rounded-3xl p-6 bg-gradient-to-br from-rose-500 via-pink-600 to-purple-700 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[340px]"
        >
          {/* Subtle decorative circles */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/15 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-900/40 rounded-full blur-xl pointer-events-none" />

          {/* Prompt Header */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/20 p-0.5 border border-white/40 mb-2 shadow-sm flex items-center justify-center text-xl">
              🕶️
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              @{username}
            </span>
            <p className="mt-1 text-sm font-medium text-white/95 px-2">
              {promptText}
            </p>
          </div>

          {/* Anonymous Content Bubble */}
          <div className="relative z-10 my-4 bg-white text-slate-900 rounded-2xl p-5 shadow-xl border border-white/20 text-center flex items-center justify-center min-h-[110px]">
            <p className="text-base font-bold leading-relaxed break-words">
              {messageContent}
            </p>
          </div>

          {/* Footer watermark */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-medium text-white/75 pt-1">
            <span className="flex items-center gap-1">
              🔒 100% Anonymous
            </span>
            <span className="bg-black/30 px-2.5 py-0.5 rounded-full font-bold tracking-tight">
              any-mous.me
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="w-full mt-5 flex gap-2">
          <button
            onClick={handleCopyText}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 transition-all active:scale-95 border border-white/10"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied Text!" : "Copy Text"}</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 transition-all active:scale-95 shadow-md shadow-pink-500/20"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
