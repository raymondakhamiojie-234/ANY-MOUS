"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Sparkles,
  ExternalLink,
  Settings,
  Bell,
  CheckCircle2,
  Inbox,
  Save,
  Check,
  AlertCircle,
  RefreshCw,
  Filter,
  ShieldX,
  Ban,
  Crown,
  ArrowRight,
} from "lucide-react";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { MessageCard, MessageItem } from "@/components/MessageCard";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";

interface UserData {
  id: string;
  username: string;
  email: string;
  promptText: string;
  isAcceptingMessages: boolean;
  blockedWords?: string | null;
  isPro?: boolean;
  proExpiresAt?: string | null;
}

interface DashboardClientProps {
  initialUser: UserData;
  initialMessages: MessageItem[];
}

export function DashboardClient({
  initialUser,
  initialMessages,
}: DashboardClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserData>(initialUser);
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  // Pro State
  const [showProModal, setShowProModal] = useState(false);

  // Settings State
  const [isAccepting, setIsAccepting] = useState(initialUser.isAcceptingMessages);
  const [promptText, setPromptText] = useState(initialUser.promptText);
  const [blockedWords, setBlockedWords] = useState(initialUser.blockedWords || "");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingBlockedWords, setIsSavingBlockedWords] = useState(false);
  const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);
  const [blockedWordsSavedAlert, setBlockedWordsSavedAlert] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check for Paystack callback references in URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const reference = url.searchParams.get("reference");
    const payment = url.searchParams.get("payment");

    if (reference || payment === "success") {
      fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference || "success")}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.verified || data.isPro) {
            setUser((prev) => ({ ...prev, isPro: true }));
            showNotice("🎉 Pro Subscription Activated! Sender clues are now unlocked.");
          }
        })
        .catch(() => {});
    }
  }, []);

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const readCount = messages.filter((m) => m.isRead).length;

  const filteredMessages = messages.filter((m) => {
    if (filter === "unread") return !m.isRead;
    if (filter === "read") return m.isRead;
    return true;
  });

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleToggleAccepting = async () => {
    const nextVal = !isAccepting;
    setIsAccepting(nextVal);

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAcceptingMessages: nextVal }),
      });
      if (!res.ok) throw new Error();
      setUser((prev) => ({ ...prev, isAcceptingMessages: nextVal }));
      showNotice(nextVal ? "Inbox is now open for messages" : "Inbox paused");
    } catch {
      setIsAccepting(!nextVal);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingSettings) return;

    setIsSavingSettings(true);
    setSettingsError("");
    setSettingsSavedAlert(false);

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText: promptText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update prompt text");

      setUser((prev) => ({ ...prev, promptText: data.user.promptText }));
      setSettingsSavedAlert(true);
      setTimeout(() => setSettingsSavedAlert(false), 3000);
    } catch (err: any) {
      setSettingsError(err.message || "Failed to save prompt text");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveBlockedWords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingBlockedWords) return;

    setIsSavingBlockedWords(true);
    setBlockedWordsSavedAlert(false);

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedWords }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update blocked words");

      setUser((prev) => ({ ...prev, blockedWords: data.user.blockedWords }));
      setBlockedWordsSavedAlert(true);
      setTimeout(() => setBlockedWordsSavedAlert(false), 3000);
      showNotice("Blocked words list updated!");
    } catch (err: any) {
      alert(err.message || "Failed to save blocked words");
    } finally {
      setIsSavingBlockedWords(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
    );

    try {
      await fetch(`/api/messages/${id}/read`, { method: "PATCH" });
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: false } : m))
      );
    }
  };

  const handleDeleteMessage = async (id: string) => {
    const previous = [...messages];
    setMessages((prev) => prev.filter((m) => m.id !== id));

    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showNotice("Message deleted");
    } catch {
      setMessages(previous);
      alert("Failed to delete message. Please try again.");
    }
  };

  const handleBlockSender = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/block`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to block sender");
      }

      showNotice("Sender blocked! They cannot send future messages.");
    } catch (err: any) {
      alert(err.message || "Failed to block sender.");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      window.location.reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col gap-5">
      {/* Toast Notification Banner */}
      {actionNotice && (
        <div className="sticky top-20 z-50 p-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white text-xs font-bold shadow-lg shadow-pink-500/30 flex items-center justify-between animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* Welcome & Public Link Card */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-xl glass-card-glow flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center font-black text-white text-lg shadow-md shadow-pink-500/20">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                <span>@{user.username}</span>
                {user.isPro ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                    <Crown className="w-3 h-3" /> PRO
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </h2>
              <p className="text-xs text-slate-400 font-medium">Your Anonymous Inbox</p>
            </div>
          </div>

          <a
            href={`/u/${user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
            title="Open public profile in new tab"
          >
            <span>Preview</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Share Link Banner */}
        <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-3.5 flex flex-col gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Your Secret Link
          </span>
          <div className="bg-slate-900/90 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 truncate border border-white/5 select-all">
            {typeof window !== "undefined"
              ? `${window.location.origin}/u/${user.username}`
              : `http://localhost:3000/u/${user.username}`}
          </div>
          <CopyLinkButton username={user.username} />
        </div>
      </div>

      {/* Pro Subscription Banner */}
      {!user.isPro ? (
        <div className="rounded-3xl p-5 bg-gradient-to-r from-amber-500/20 via-pink-500/15 to-purple-500/20 border border-amber-500/40 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-400/20 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Upgrade to ANY-MOUS Pro</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  HOT
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                See who sent you messages! Unlock exact City/Country, Device, and Network clues.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowProModal(true)}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-400/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unlock for ₦2,500/mo</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>PRO Member Active</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              <p className="text-[11px] text-slate-400">All anonymous sender clues are unlocked</p>
            </div>
          </div>
          <span className="text-[11px] text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Active
          </span>
        </div>
      )}

      {/* Control Panel: Pause Messages & Custom Prompt */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-bold text-white">Inbox & Safety Controls</h3>
          </div>
          <span className="text-[11px] text-slate-400">Settings</span>
        </div>

        {/* Toggle Accepting Messages */}
        <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
          <div>
            <p className="text-xs font-bold text-white">Accepting Messages</p>
            <p className="text-[11px] text-slate-400">
              {isAccepting ? "Public link is active and receiving messages" : "Link paused (visitors cannot submit)"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleAccepting}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isAccepting ? "bg-gradient-to-r from-pink-500 to-rose-500" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isAccepting ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Custom Prompt Form */}
        <form onSubmit={handleSavePrompt} className="flex flex-col gap-2">
          <label className="text-xs font-bold text-white flex items-center justify-between">
            <span>Custom Prompt Card Text</span>
            <span className="text-[10px] text-slate-500">{promptText.length}/120</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value.slice(0, 120))}
              placeholder="e.g. Send me an anonymous message!"
              className="flex-1 bg-slate-950/80 rounded-xl px-3.5 py-2 text-xs text-white border border-white/10 focus:outline-none focus:border-pink-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSavingSettings || promptText === user.promptText}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
            >
              {isSavingSettings ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : settingsSavedAlert ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{settingsSavedAlert ? "Saved!" : "Save"}</span>
            </button>
          </div>
          {settingsError && (
            <p className="text-[11px] text-rose-400">{settingsError}</p>
          )}
        </form>

        {/* Per-User Blocked Words Setting */}
        <form onSubmit={handleSaveBlockedWords} className="flex flex-col gap-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldX className="w-3.5 h-3.5 text-rose-400" />
              <span>Blocked Words Filter</span>
            </label>
            <span className="text-[10px] text-slate-500">Comma-separated</span>
          </div>
          <p className="text-[11px] text-slate-400 -mt-1">
            Messages containing these words will be silently dropped without notifying the sender.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={blockedWords}
              onChange={(e) => setBlockedWords(e.target.value)}
              placeholder="e.g. spam, hate, promo, ugly"
              className="flex-1 bg-slate-950/80 rounded-xl px-3.5 py-2 text-xs text-white border border-white/10 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSavingBlockedWords || blockedWords === (user.blockedWords || "")}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
            >
              {isSavingBlockedWords ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : blockedWordsSavedAlert ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{blockedWordsSavedAlert ? "Saved!" : "Save"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Message Statistics Bar */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="glass-panel rounded-2xl p-3 border border-white/10 text-center">
          <span className="text-xs text-slate-400 font-medium">Total</span>
          <p className="text-xl font-black text-white mt-0.5">{messages.length}</p>
        </div>
        <div className="glass-panel rounded-2xl p-3 border border-pink-500/20 text-center">
          <span className="text-xs text-pink-300 font-medium">Unread</span>
          <p className="text-xl font-black text-pink-400 mt-0.5">{unreadCount}</p>
        </div>
        <div className="glass-panel rounded-2xl p-3 border border-white/10 text-center">
          <span className="text-xs text-slate-400 font-medium">Read</span>
          <p className="text-xl font-black text-slate-300 mt-0.5">{readCount}</p>
        </div>
      </div>

      {/* Messages Header & Filter Tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-pink-400" />
            <h3 className="text-base font-black text-white">Received Messages</h3>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs inline-flex items-center gap-1"
            title="Refresh inbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-pink-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-950/70 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-pink-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "unread"
                ? "bg-pink-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter("read")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "read"
                ? "bg-pink-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Read ({readCount})
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex flex-col gap-3 pb-12">
        {filteredMessages.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center border border-white/10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {filter === "unread" ? "No unread messages!" : "No messages yet"}
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              {filter === "unread"
                ? "You've read all your anonymous messages. Good job!"
                : "Share your link on your Instagram story, Snapchat, or TikTok bio to start receiving secrets!"}
            </p>
            <CopyLinkButton username={user.username} variant="compact" />
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <MessageCard
              key={msg.id}
              message={msg}
              username={user.username}
              promptText={user.promptText}
              isPro={user.isPro}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteMessage}
              onBlockSender={handleBlockSender}
              onOpenProModal={() => setShowProModal(true)}
            />
          ))
        )}
      </div>

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
      />
    </div>
  );
}
