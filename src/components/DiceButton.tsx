"use client";

import React, { useState } from "react";
import { Dices, Sparkles } from "lucide-react";
import { getRandomIcebreaker } from "@/lib/icebreakers";

interface DiceButtonProps {
  onSelect: (icebreaker: string) => void;
  currentValue?: string;
  disabled?: boolean;
}

export function DiceButton({ onSelect, currentValue, disabled }: DiceButtonProps) {
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (disabled || isRolling) return;

    setIsRolling(true);
    const newQuestion = getRandomIcebreaker(currentValue);

    setTimeout(() => {
      onSelect(newQuestion);
      setIsRolling(false);
    }, 400);
  };

  return (
    <button
      type="button"
      onClick={handleRoll}
      disabled={disabled}
      className={`group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 active:scale-95 transition-all shadow-md shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${
        isRolling ? "ring-2 ring-pink-300 ring-offset-2 ring-offset-slate-900" : ""
      }`}
      title="Click for a random fun question!"
    >
      <Dices
        className={`w-4 h-4 transition-transform duration-300 ${
          isRolling ? "animate-dice" : "group-hover:rotate-45"
        }`}
      />
      <span>Roll for Icebreaker</span>
      <Sparkles className="w-3 h-3 text-yellow-200 animate-pulse" />
    </button>
  );
}
