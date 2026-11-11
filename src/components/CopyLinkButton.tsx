"use client";

import React, { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

interface CopyLinkButtonProps {
  username: string;
  className?: string;
  variant?: "primary" | "secondary" | "compact";
}

export function CopyLinkButton({
  username,
  className = "",
  variant = "primary",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const getProfileUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/u/${username}`;
    }
    return `http://localhost:3000/u/${username}`;
  };

  const handleCopy = async () => {
    const url = getProfileUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    const url = getProfileUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Send anonymous messages to @${username}`,
          text: `Ask me anything anonymously! Send your confession or question:`,
          url: url,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }
    handleCopy();
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          copied
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            : "bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10"
        } ${className}`}
        title="Copy profile link"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copied ? "Copied!" : "Copy"}</span>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleCopy}
        className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg ${
          copied
            ? "bg-emerald-500 text-white shadow-emerald-500/25 ring-2 ring-emerald-300"
            : "bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white shadow-rose-500/25"
        }`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 animate-bounce" />
            <span>Copied to Clipboard!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      <button
        onClick={handleNativeShare}
        className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/10 transition-all shadow-md"
        title="Share profile link"
      >
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  );
}
