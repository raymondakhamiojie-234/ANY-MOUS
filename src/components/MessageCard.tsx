"use client";

import React, { useState } from "react";
import {
  Trash2,
  CheckCircle2,
  Clock,
  Share2,
  Sparkles,
  Ban,
  ShieldAlert,
  Reply,
  Lock,
  Crown,
  MapPin,
  Smartphone,
  Wifi,
} from "lucide-react";
import { ReplyShareModal } from "./ReplyShareModal";

export interface MessageItem {
  id: string;
  content: string;
  senderHash: string;
  senderLocation?: string | null;
  senderDevice?: string | null;
  senderNetwork?: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

interface MessageCardProps {
  message: MessageItem;
  username: string;
  promptText: string;
  isPro?: boolean;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBlockSender: (id: string) => Promise<void>;
  onOpenProModal?: () => void;
}

export function MessageCard({
  message,
  username,
  promptText,
  isPro = false,
  onMarkAsRead,
  onDelete,
  onBlockSender,
  onOpenProModal,
}: MessageCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockedState, setBlockedState] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);

  const formatTimeAgo = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return "Just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const handleRead = async () => {
    if (message.isRead || isUpdating) return;
    setIsUpdating(true);
    try {
      await onMarkAsRead(message.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenReplyModal = () => {
    setShowReplyModal(true);
    if (!message.isRead) {
      handleRead();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    if (window.confirm("Are you sure you want to delete this anonymous message?")) {
      setIsDeleting(true);
      try {
        await onDelete(message.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleBlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBlocking || blockedState) return;
    if (
      window.confirm(
        "Block this anonymous sender?\n\nThey will no longer be able to send you messages. Their identity remains anonymous."
      )
    ) {
      setIsBlocking(true);
      try {
        await onBlockSender(message.id);
        setBlockedState(true);
      } finally {
        setIsBlocking(false);
      }
    }
  };

  const senderLocation = message.senderLocation || "Lagos, NG";
  const senderDevice = message.senderDevice || "iPhone 14";
  const senderNetwork = message.senderNetwork || "MTN Network";

  return (
    <>
      <div
        onClick={handleOpenReplyModal}
        className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-200 border cursor-pointer group ${
          message.isRead
            ? "bg-slate-900/60 border-white/5 hover:border-pink-500/30 hover:bg-slate-900/80"
            : "bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-pink-950/30 border-pink-500/30 shadow-lg shadow-pink-500/5 hover:border-pink-500/60"
        }`}
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {!message.isRead ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-500 text-white shadow-sm shadow-pink-500/40">
                <Sparkles className="w-3 h-3" />
                NEW
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-slate-400">
                Read
              </span>
            )}

            {blockedState && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                <Ban className="w-3 h-3" />
                Sender Blocked
              </span>
            )}

            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              {formatTimeAgo(message.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleOpenReplyModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-pink-300 hover:bg-white/10 transition-colors"
              title="Reply & Share as 9:16 Story Card"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleBlock}
              disabled={isBlocking || blockedState}
              className={`p-1.5 rounded-lg transition-colors ${
                blockedState
                  ? "text-red-400 bg-red-500/10"
                  : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
              } disabled:opacity-50`}
              title={blockedState ? "Sender is blocked" : "Block sender from messaging you again"}
            >
              <Ban className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              title="Delete message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Message Content */}
        <div className="my-1">
          <p className="text-sm md:text-base text-slate-100 font-medium leading-relaxed break-words group-hover:text-pink-200 transition-colors">
            {message.content}
          </p>
        </div>

        {/* Sender Clues Feature: Blurred Teaser vs Revealed */}
        {!isPro ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenProModal?.();
            }}
            className="my-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10 border border-amber-500/30 hover:border-amber-400/80 transition-all cursor-pointer flex items-center justify-between group/clue shadow-sm"
            title="Upgrade to Pro to reveal who sent this"
          >
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-400/20 text-amber-300">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-300 group-hover/clue:text-amber-200">
                  🔒 Unlock Sender Clues (Location, Device, Network)
                </span>
                <span className="text-[10px] text-slate-400 blur-[1.5px] select-none">
                  Sent from Lagos, NG • iPhone 14 • MTN Network
                </span>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/30 shrink-0">
              PRO
            </span>
          </div>
        ) : (
          <div className="my-3 p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/50 shadow-md flex items-center gap-2 text-xs animate-in fade-in">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs shrink-0">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-200 font-semibold">
              <span className="text-amber-300 font-bold">Sender Clues:</span>
              <span className="text-slate-100">
                Sent from <span className="text-amber-200 font-bold">{senderLocation}</span> •{" "}
                <span className="text-pink-300 font-bold">{senderDevice}</span> •{" "}
                <span className="text-cyan-300 font-bold">{senderNetwork}</span>
              </span>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenReplyModal();
            }}
            className="text-pink-400 hover:text-pink-300 font-bold inline-flex items-center gap-1.5 text-xs bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20 group-hover:bg-pink-500/20 transition-all"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply & Share Card →</span>
          </button>

          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {!blockedState && (
              <button
                onClick={handleBlock}
                disabled={isBlocking}
                className="text-slate-400 hover:text-amber-300 inline-flex items-center gap-1 text-[11px]"
                title="Block sender"
              >
                <ShieldAlert className="w-3 h-3 text-amber-400/80" />
                <span>Block</span>
              </button>
            )}

            {!message.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRead();
                }}
                disabled={isUpdating}
                className="text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 text-[11px] font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />
                <span>Mark read</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <ReplyShareModal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        messageContent={message.content}
        username={username}
        promptText={promptText}
      />
    </>
  );
}
