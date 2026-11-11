"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Download,
  Share2,
  Check,
  Sparkles,
  MessageCircle,
  Copy,
  Palette,
  Send,
} from "lucide-react";
import { toPng, toBlob } from "html-to-image";

interface ReplyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  username: string;
  promptText: string;
}

type CardTheme = "sunset" | "violet" | "ocean" | "midnight";

const THEME_CLASSES: Record<CardTheme, { bg: string; name: string; accent: string }> = {
  sunset: {
    name: "Sunset Neon",
    bg: "bg-gradient-to-br from-rose-500 via-pink-600 to-amber-500",
    accent: "bg-amber-400 text-slate-950",
  },
  violet: {
    name: "Cyber Violet",
    bg: "bg-gradient-to-br from-purple-700 via-indigo-600 to-pink-500",
    accent: "bg-pink-400 text-slate-950",
  },
  ocean: {
    name: "Electric Ocean",
    bg: "bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700",
    accent: "bg-cyan-300 text-slate-950",
  },
  midnight: {
    name: "Midnight Glow",
    bg: "bg-gradient-to-b from-slate-900 via-zinc-900 to-black border-2 border-pink-500/50",
    accent: "bg-pink-500 text-white",
  },
};

const QUICK_REPLIES = [
  "Haha 100% true! 😂",
  "No way, who is this?! 👀",
  "Thank you so much! ❤️",
  "DM me on Instagram to confess! ✨",
];

export function ReplyShareModal({
  isOpen,
  onClose,
  messageContent,
  username,
  promptText,
}: ReplyShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [replyText, setReplyText] = useState("");
  const [theme, setTheme] = useState<CardTheme>("sunset");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
      // Rasterize the 9:16 vertical card at 2x resolution
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `anymous-reply-${username}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Story card PNG downloaded! Ready to post 📸");
    } catch (err) {
      console.error("Failed to export PNG:", err);
      showToast("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current || isSharing) return;

    setIsSharing(true);
    try {
      const blob = await toBlob(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
      });

      if (!blob) throw new Error("Could not create image blob");

      const file = new File([blob], `anymous-story-${username}.png`, {
        type: "image/png",
      });

      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: `Anonymous Q&A reply from @${username}`,
          text: `"${messageContent}" — My reply on ANY-MOUS: ${replyText}`,
          files: [file],
        });
        showToast("Shared successfully!");
      } else {
        // Fallback: trigger PNG download and notify user
        await handleDownload();
        showToast("Saved PNG! You can now upload it to your Instagram Story or WhatsApp Status.");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Share error:", err);
        // Fallback to download
        await handleDownload();
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyText = async () => {
    const text = `Q: "${messageContent}"\n\nA: "${replyText || "Check out my story!"}"\n\n— via any-mous.me/u/${username}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Reply text copied to clipboard!");
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 p-4 sm:p-5 shadow-2xl flex flex-col items-center max-h-[95vh] overflow-y-auto">
        {/* Toast alert */}
        {toastMessage && (
          <div className="absolute top-3 left-4 right-4 z-30 p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white text-xs font-bold shadow-lg text-center animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* Modal Top Bar */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Reply & Share Story Card
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Picker */}
        <div className="w-full flex items-center justify-center gap-1.5 mb-3">
          {(["sunset", "violet", "ocean", "midnight"] as CardTheme[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                theme === t
                  ? "bg-white text-slate-900 shadow-sm scale-105"
                  : "bg-white/10 text-slate-300 hover:bg-white/15"
              }`}
            >
              {THEME_CLASSES[t].name}
            </button>
          ))}
        </div>

        {/* 9:16 Vertical Story Card Node for Rasterization */}
        <div
          ref={cardRef}
          id="reply-story-card"
          className={`w-[290px] h-[515px] sm:w-[315px] sm:h-[560px] rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none ${THEME_CLASSES[theme].bg}`}
          style={{ aspectRatio: "9/16" }}
        >
          {/* Subtle background glow bubbles */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-black/30 rounded-full blur-2xl pointer-events-none" />

          {/* Top: Recipient Header */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md p-0.5 border border-white/40 mb-1.5 shadow-md flex items-center justify-center text-xl">
              🕶️
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-black/25 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-white">
              <span>@{username}</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-white/90 px-2 line-clamp-1">
              {promptText}
            </p>
          </div>

          {/* Middle: Anonymous Question Bubble */}
          <div className="relative z-10 my-auto flex flex-col gap-3">
            <div className="bg-white text-slate-900 rounded-2xl p-4 shadow-xl border border-white/40 text-center relative">
              <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm">
                Anonymous Q&A
              </span>
              <p className="text-sm sm:text-base font-extrabold leading-relaxed text-slate-900 break-words mt-1">
                &quot;{messageContent}&quot;
              </p>
            </div>

            {/* User's Reply Bubble */}
            <div className="bg-slate-950/80 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 shadow-xl text-left">
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-black uppercase tracking-wider text-pink-400">
                <MessageCircle className="w-3 h-3" />
                <span>@{username}&apos;s Reply</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white leading-snug break-words">
                {replyText.trim() ? (
                  replyText
                ) : (
                  <span className="text-white/40 italic font-medium">
                    Type your reply below to display here...
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Bottom: Branding Watermark & Trust Badge */}
          <div className="relative z-10 flex items-center justify-between text-[10px] font-bold text-white/85 pt-1 border-t border-white/10">
            <span className="flex items-center gap-1">
              🔒 100% Anonymous
            </span>
            <span className="bg-black/35 backdrop-blur-sm px-2.5 py-0.5 rounded-full tracking-tight">
              any-mous.me
            </span>
          </div>
        </div>

        {/* Reply Input Controls */}
        <div className="w-full mt-3 flex flex-col gap-2">
          <div className="relative rounded-xl bg-slate-950/80 border border-white/10 p-2.5 focus-within:border-pink-500/60 transition-all">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value.slice(0, 200))}
              placeholder="Type your public response here..."
              rows={2}
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 outline-none resize-none"
            />
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
              <span className="text-slate-500">Live preview updates above</span>
              <span className={replyText.length >= 200 ? "text-rose-400" : "text-slate-500"}>
                {replyText.length}/200
              </span>
            </div>
          </div>

          {/* Quick Reply Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_REPLIES.map((quick, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setReplyText(quick)}
                className="shrink-0 px-2 py-1 rounded-lg text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-colors"
              >
                {quick}
              </button>
            ))}
          </div>

          {/* Action Buttons: Download PNG & Share */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 active:scale-95 transition-all shadow-md shadow-pink-500/20 disabled:opacity-50"
              title="Download 9:16 PNG image"
            >
              {isDownloading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? "Generating..." : "Download PNG"}</span>
            </button>

            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 active:scale-95 transition-all border border-white/10 disabled:opacity-50"
              title="Share to Instagram Story or WhatsApp Status"
            >
              {isSharing ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-pink-400" />
              )}
              <span>Share to Story</span>
            </button>

            <button
              onClick={handleCopyText}
              className="p-2.5 rounded-xl text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="Copy text"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
