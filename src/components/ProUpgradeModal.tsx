"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Crown,
  Sparkles,
  MapPin,
  Smartphone,
  Wifi,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  LogIn,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProUpgradeModal({ isOpen, onClose }: ProUpgradeModalProps) {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; email: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  // Check auth status when modal opens
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.authenticated && data.user) {
          setCurrentUser(data.user);
          setNeedsLogin(false);
        } else {
          setCurrentUser(null);
          setNeedsLogin(true);
        }
      })
      .catch(() => {
        setCurrentUser(null);
        setNeedsLogin(true);
      })
      .finally(() => setLoadingUser(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickDemoLogin = async () => {
    setQuickLoginLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "alex", password: "password123" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sign in as demo user.");

      setCurrentUser(data.user);
      setNeedsLogin(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in.");
    } finally {
      setQuickLoginLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const bodyPayload = !currentUser && emailInput.trim() ? { email: emailInput.trim() } : {};

      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setNeedsLogin(true);
          throw new Error("Please sign in or enter your account email to link your Pro subscription.");
        }
        throw new Error(data.error || "Failed to initialize Paystack checkout.");
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No authorization URL returned from Paystack.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/30 p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Glow ambient background elements */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
          <Crown className="w-7 h-7 text-amber-100" />
        </div>

        <h3 className="text-xl font-black text-white text-center">
          ANY-MOUS <span className="text-amber-400">PRO</span>
        </h3>
        <p className="text-xs text-slate-300 text-center mt-1">
          Unlock secret clues on who sent every anonymous confession
        </p>

        {/* Account Info Pill */}
        {currentUser && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Upgrading account @{currentUser.username}</span>
          </div>
        )}

        {/* Price Tag */}
        <div className="my-3 py-2 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
          <span className="text-2xl font-black text-amber-300">₦2,500</span>
          <span className="text-xs text-amber-200/80 font-semibold"> / month</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Cancel anytime with 1 click</p>
        </div>

        {/* Feature List */}
        <div className="w-full flex flex-col gap-2 my-1">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-white/5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Geographic Location Clues</p>
              <p className="text-[11px] text-slate-400">Reveal City and Country (e.g. Lagos, NG)</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-white/5">
            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Device & OS Fingerprint</p>
              <p className="text-[11px] text-slate-400">See if they used iPhone 14, Android, or Mac</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-white/5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Cellular & Network Carrier</p>
              <p className="text-[11px] text-slate-400">Detect MTN 5G, Airtel, or Broadband WiFi</p>
            </div>
          </div>
        </div>

        {/* Unauthenticated Alert & Quick Sign-in Callout */}
        {needsLogin && !currentUser && (
          <div className="w-full mt-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2 text-left animate-in fade-in">
            <div className="flex items-start gap-2 text-amber-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Please sign in first so your Pro upgrade is linked to your inbox.</span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={quickLoginLoading}
                className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                {quickLoginLoading ? (
                  <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-3 h-3" />
                )}
                <span>Quick Sign-In (@alex)</span>
              </button>

              <Link
                href="/login?redirect=/dashboard"
                className="py-1.5 px-3 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center gap-1"
              >
                <LogIn className="w-3 h-3" />
                <span>Log In</span>
              </Link>
            </div>

            <div className="relative flex items-center justify-center my-0.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider bg-slate-900 px-2">
                or enter account email
              </span>
            </div>

            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. alex@example.com"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        {errorMsg && (
          <p className="text-[11px] text-rose-400 text-center my-2">{errorMsg}</p>
        )}

        {/* CTA Button */}
        <button
          onClick={handleCheckout}
          disabled={loading || (needsLogin && !currentUser && !emailInput.trim())}
          className="w-full mt-3 py-3.5 px-4 rounded-2xl text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-95 transition-all shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2 text-slate-950">
              <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              <span>Redirecting to Paystack...</span>
            </span>
          ) : (
            <>
              <span>Upgrade with Paystack</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured by Paystack recurring billing</span>
        </div>
      </div>
    </div>
  );
}
