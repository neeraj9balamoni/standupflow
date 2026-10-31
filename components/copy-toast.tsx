"use client";

import React, { useEffect } from "react";
import { Sparkles, X } from "lucide-react";

interface CopyToastProps {
  timeSavedMinutes: number;
  onDismiss: () => void;
}

export function CopyToast({ timeSavedMinutes, onDismiss }: CopyToastProps) {
  useEffect(() => {
    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);

    // Dismiss on any click anywhere on document
    const handleClick = () => {
      onDismiss();
    };
    window.addEventListener("click", handleClick);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleClick);
    };
  }, [onDismiss]);

  const displayTime = Math.max(2, timeSavedMinutes);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onDismiss();
      }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-200 cursor-pointer animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 dark:text-blue-600 flex items-center justify-center shrink-0">
        <Sparkles size={16} className="size-4 w-4 h-4 fill-current" />
      </div>

      <div className="text-xs">
        <span className="font-bold">Standup copied!</span>
        <p className="text-slate-300 dark:text-slate-600 mt-0.5">
          Nice. We worked smarter together and saved you about {displayTime} minutes.
        </p>
      </div>

      <button
        onClick={onDismiss}
        className="p-1 rounded-lg text-slate-400 hover:text-white dark:hover:text-slate-900 transition ml-2 cursor-pointer"
        aria-label="Dismiss toast"
      >
        <X size={14} className="size-3.5 w-3.5 h-3.5" />
      </button>
    </div>
  );
}
