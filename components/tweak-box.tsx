"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Send, Mic } from "lucide-react";

interface TweakBoxProps {
  onApplyTweak: (instruction: string) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const QUICK_TWEAKS = [
  "Make it shorter and more direct",
  "More formal executive tone",
  "Highlight blockers with high urgency",
  "Include more technical specifics from notes",
];

export function TweakBox({ onApplyTweak, isGenerating, disabled }: TweakBoxProps) {
  const [instruction, setInstruction] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isGenerating || disabled) return;
    onApplyTweak(instruction.trim());
    setInstruction("");
  };

  const handleQuickTweak = (text: string) => {
    if (isGenerating || disabled) return;
    onApplyTweak(text);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={16} className="size-4 w-4 h-4 text-blue-500" />
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Tweak your standup (1 ticket)
        </h4>
        <span className="text-[11px] text-slate-400 font-normal">
          Dictate or type any phrasing adjustment
        </span>
      </div>

      {/* Quick Pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_TWEAKS.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => handleQuickTweak(pill)}
            disabled={isGenerating || disabled}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition disabled:opacity-50 cursor-pointer"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={isGenerating || disabled}
            placeholder="e.g. 'Make the Slack version punchier' or 'Add more focus on tomorrow's release'"
            id="tweak-instruction-input"
            className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition disabled:opacity-50"
          />
          <Mic size={16} className="size-4 w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <button
          type="submit"
          disabled={!instruction.trim() || isGenerating || disabled}
          id="apply-tweak-btn"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
        >
          <Send size={14} className="size-3.5 w-3.5 h-3.5" />
          <span>Apply</span>
        </button>
      </form>
    </div>
  );
}
