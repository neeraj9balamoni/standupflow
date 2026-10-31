"use client";

import React, { useState } from "react";
import { Check, Copy, Mail, RefreshCw, MessageSquare, AlignLeft, Sparkles } from "lucide-react";

export interface StandupCardsData {
  slack: string;
  email: string;
  short: string;
}

interface StandupCardsProps {
  data: StandupCardsData;
  onChange: (updated: StandupCardsData) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  onCopySuccess: (type: "slack" | "email" | "short", text: string) => void;
}

function countWords(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export function StandupCards({
  data,
  onChange,
  onRegenerate,
  isGenerating,
  onCopySuccess,
}: StandupCardsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: "slack" | "email" | "short", content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKey(key);
      onCopySuccess(key, content);

      // Light celebratory confetti burst
      try {
        const { default: confetti } = await import("canvas-confetti");
        confetti({
          particleCount: 28,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#3b82f6", "#6366f1", "#06b6d4"],
          disableForReducedMotion: true,
        });
      } catch (error) {
        console.error("Could not load the copy celebration effect:", error);
      }

      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const parseEmailMailto = (emailContent: string) => {
    const lines = emailContent.split("\n");
    let subject = "Daily Standup Update";
    let body = emailContent;

    const subjectLine = lines.find((l) => l.toLowerCase().startsWith("subject:"));
    if (subjectLine) {
      subject = subjectLine.replace(/subject:\s*/i, "").trim();
      body = lines.filter((l) => !l.toLowerCase().startsWith("subject:")).join("\n").trim();
    }

    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="size-5 w-5 h-5 text-blue-500" />
            Generated Standup Updates
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Editable plain text. Click any card to tweak, or copy in one click.
          </p>
        </div>

        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          id="regenerate-all-btn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={`size-3.5 w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
          <span>Regenerate</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Slack / Teams Card */}
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:border-blue-500/50 transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <MessageSquare size={16} className="size-4 w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Slack / Teams</h4>
                <span className="text-[10px] text-slate-400 font-medium">Under 120 words</span>
              </div>
            </div>

            <button
              onClick={() => handleCopy("slack", data.slack)}
              id="copy-slack-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
            >
              {copiedKey === "slack" ? (
                <>
                  <Check size={14} className="size-3.5 w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="size-3.5 w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <textarea
              value={data.slack}
              onChange={(e) => onChange({ ...data, slack: e.target.value })}
              id="output-slack-textarea"
              rows={8}
              className="w-full flex-1 resize-y bg-transparent text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans focus:outline-none p-1 rounded"
              placeholder="Slack format will appear here..."
            />
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{countWords(data.slack)} words</span>
              <span>{data.slack.length} chars</span>
            </div>
          </div>
        </div>

        {/* 2. Formal Email Card */}
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:border-indigo-500/50 transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Mail size={16} className="size-4 w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Formal Email</h4>
                <span className="text-[10px] text-slate-400 font-medium">To Manager / Executive</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={parseEmailMailto(data.email)}
                id="open-in-email-btn"
                title="Open in email client"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Mail size={14} className="size-3.5 w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open</span>
              </a>

              <button
                onClick={() => handleCopy("email", data.email)}
                id="copy-email-btn"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
              >
                {copiedKey === "email" ? (
                  <>
                    <Check size={14} className="size-3.5 w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} className="size-3.5 w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <textarea
              value={data.email}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              id="output-email-textarea"
              rows={8}
              className="w-full flex-1 resize-y bg-transparent text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans focus:outline-none p-1 rounded"
              placeholder="Formal email format will appear here..."
            />
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{countWords(data.email)} words</span>
              <span>{data.email.length} chars</span>
            </div>
          </div>
        </div>

        {/* 3. Short Summary Card */}
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:border-cyan-500/50 transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <AlignLeft size={16} className="size-4 w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Short Summary</h4>
                <span className="text-[10px] text-slate-400 font-medium">Under 40 words</span>
              </div>
            </div>

            <button
              onClick={() => handleCopy("short", data.short)}
              id="copy-short-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition cursor-pointer"
            >
              {copiedKey === "short" ? (
                <>
                  <Check size={14} className="size-3.5 w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="size-3.5 w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <textarea
              value={data.short}
              onChange={(e) => onChange({ ...data, short: e.target.value })}
              id="output-short-textarea"
              rows={8}
              className="w-full flex-1 resize-y bg-transparent text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans focus:outline-none p-1 rounded"
              placeholder="Short summary format will appear here..."
            />
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{countWords(data.short)} words</span>
              <span>{data.short.length} chars</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
