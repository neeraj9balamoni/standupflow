"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useStandupStore } from "./store";
import { StandupCards, StandupCardsData } from "./standup-cards";
import { TweakBox } from "./tweak-box";
import {
  detectPastedCodeOrMarkup,
  isInstructionOverride,
  NO_WORK_NOTES_MESSAGE,
} from "@/lib/validation";
import {
  Mic,
  Sparkles,
  AlertCircle,
  Clock,
  Ticket,
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface GeneratorProps {
  onStandupGenerated?: (entry: {
    id: string;
    createdAt: string;
    input: { done: string; blockers: string; plans: string };
    output: StandupCardsData;
  }) => void;
  onCopyStandup?: (type: string, text: string, inputWords: number) => void;
  onTicketsUpdated?: (left: number, total: number) => void;
}

export function Generator({
  onStandupGenerated,
  onCopyStandup,
  onTicketsUpdated,
}: GeneratorProps) {
  const { data: session, status: authStatus } = useSession();
  const {
    addHistoryItem,
    recordCopy,
    ticketsLeft: storeTicketsLeft,
    ticketsTotal: storeTicketsTotal,
    setTickets: updateStoreTickets,
  } = useStandupStore();

  // Form states
  const [done, setDone] = useState("");
  const [blockers, setBlockers] = useState("");
  const [plans, setPlans] = useState("");

  // Generation & Output states
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [output, setOutput] = useState<StandupCardsData | null>(null);

  // Ticket states
  const [ticketsLeft, setTicketsLeft] = useState<number | null>(storeTicketsLeft);
  const [ticketsTotal, setTicketsTotal] = useState<number>(storeTicketsTotal ?? 6);
  const [resetInSeconds, setResetInSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (storeTicketsLeft !== null) {
      setTicketsLeft(storeTicketsLeft);
    }
    if (storeTicketsTotal !== null) {
      setTicketsTotal(storeTicketsTotal);
    }
  }, [storeTicketsLeft, storeTicketsTotal]);

  // Character count calculation
  const totalChars = done.length + blockers.length + plans.length;
  const isOverLimit = totalChars > 1500;
  const isNearLimit = totalChars > 1300 && !isOverLimit;

  // Code detection live check
  const hasCodeOrMarkup =
    detectPastedCodeOrMarkup(done) ||
    detectPastedCodeOrMarkup(blockers) ||
    detectPastedCodeOrMarkup(plans);

  // Fetch ticket status on mount or when session changes
  useEffect(() => {
    if (session?.user) {
      fetch("/api/tickets")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.ticketsLeft === "number") {
            setTicketsLeft(data.ticketsLeft);
            setTicketsTotal(data.ticketsTotal ?? 6);
            setResetInSeconds(data.resetInSeconds ?? null);
            updateStoreTickets(data.ticketsLeft, data.ticketsTotal ?? 6);
            onTicketsUpdated?.(data.ticketsLeft, data.ticketsTotal ?? 6);
          }
        })
        .catch((err) => console.error("Ticket check failed:", err));
    }
  }, [session, updateStoreTickets, onTicketsUpdated]);

  const handleGenerate = async (
    mode: "generate" | "regenerate" | "tweak" = "generate",
    instruction?: string
  ) => {
    if (!done.trim()) {
      setErrorMessage("Please describe what you worked on before generating.");
      return;
    }
    if (isOverLimit) {
      setErrorMessage("Total character count exceeds the 1,500 limit. Please trim your notes.");
      return;
    }
    if (hasCodeOrMarkup) {
      setErrorMessage("Invalid input. Please describe your work in plain words.");
      return;
    }
    if (
      instruction &&
      (detectPastedCodeOrMarkup(instruction) ||
        isInstructionOverride(instruction))
    ) {
      setErrorMessage(
        isInstructionOverride(instruction)
          ? NO_WORK_NOTES_MESSAGE
          : "Invalid input. Please describe your work in plain words."
      );
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          done: done.trim(),
          blockers: blockers.trim(),
          plans: plans.trim(),
          instruction: instruction?.trim(),
          previous: output || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.error?.message || "Failed to generate standup. Please try again."
        );
        if (typeof result.ticketsLeft === "number") {
          setTicketsLeft(result.ticketsLeft);
          setTicketsTotal(result.ticketsTotal ?? 6);
          onTicketsUpdated?.(result.ticketsLeft, result.ticketsTotal ?? 6);
        }
        return;
      }

      const generatedData: StandupCardsData = result.data;
      setOutput(generatedData);

      if (typeof result.ticketsLeft === "number") {
        setTicketsLeft(result.ticketsLeft);
        setTicketsTotal(result.ticketsTotal ?? 6);
        updateStoreTickets(result.ticketsLeft, result.ticketsTotal ?? 6);
        onTicketsUpdated?.(result.ticketsLeft, result.ticketsTotal ?? 6);
      }

      // Save to localStorage history via shared store
      const newEntry = {
        id: `standup-${Date.now()}`,
        createdAt: new Date().toISOString(),
        input: { done, blockers, plans },
        output: generatedData,
      };

      addHistoryItem(newEntry);
      onStandupGenerated?.(newEntry);
    } catch (err) {
      console.error("Network or generation error:", err);
      setErrorMessage("Network error. Could not connect to generation service. Please retry.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySuccess = (type: "slack" | "email" | "short", text: string) => {
    const inputWords = `${done} ${blockers} ${plans}`.trim().split(/\s+/).filter(Boolean).length;
    recordCopy(type, text, inputWords);
    onCopyStandup?.(type, text, inputWords);
  };

  // Friendly Ticket Progress Messages (Section 7)
  const renderTicketMessage = () => {
    if (ticketsLeft === null) return null;
    if (ticketsLeft === 0) {
      return (
        <span className="text-red-500 font-semibold flex items-center gap-1">
          <AlertCircle size={14} className="size-3.5 w-3.5 h-3.5" />
          0 tickets left. You can request more below.
        </span>
      );
    }
    if (ticketsLeft === 1) {
      return (
        <span className="text-amber-500 font-semibold flex items-center gap-1">
          <Ticket size={14} className="size-3.5 w-3.5 h-3.5" />
          Last ticket. Make it count.
        </span>
      );
    }
    if (ticketsLeft === 3) {
      return (
        <span className="text-blue-500 font-medium">
          Halfway there. 3 tickets left this week.
        </span>
      );
    }
    return (
      <span className="text-slate-500 dark:text-slate-400">
        <strong className="text-slate-800 dark:text-slate-200">{ticketsLeft}</strong> tickets left this week
      </span>
    );
  };

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";
  const userEmail = session?.user?.email || "";
  const userId = session?.user?.id || "";
  const requestTicketsMailto = `mailto:${contactEmail}?subject=${encodeURIComponent(
    "StandupFlow: request more tickets"
  )}&body=${encodeURIComponent(
    `Hi,\n\nI have used all my tickets for this week and would like to request additional tickets.\n\nMy Google Account Email: ${userEmail}\nMy StandupFlow Account ID: ${userId}\nPlease raise my limit.\n\nThanks!`
  )}`;

  return (
    <section id="generator" className="py-12 scroll-mt-24 scroll-reveal">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl p-6 sm:p-8 backdrop-blur-md">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mb-2">
                <Mic size={12} className="size-3 w-3 h-3 animate-pulse" />
                <span>Dictation friendly</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Standup Generator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Speak or paste rough notes. Plain text fields work naturally with dictation.
              </p>
            </div>

            {/* Live Character Counter */}
            <div className="flex flex-col items-end">
              <span
                id="char-counter"
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                  isOverLimit
                    ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800"
                    : isNearLimit
                    ? "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                {totalChars} / 1,500 chars
              </span>
              <span className="text-[10px] text-slate-400 mt-1">~250 words max</span>
            </div>
          </div>

          {/* Textareas */}
          <div className="space-y-4 my-6">
            {/* Field 1: What did you work on? (Required) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="done-input"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} className="size-3.5 w-3.5 h-3.5 text-blue-500" />
                  What did you work on? <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">{done.length} chars</span>
              </div>
              <textarea
                id="done-input"
                value={done}
                onChange={(e) => setDone(e.target.value)}
                rows={4}
                placeholder="e.g. Fixed the auth cookie redirect loop, wrote unit tests for payment webhook, synced with QA on test flakiness..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-sans leading-relaxed resize-y"
              />
            </div>

            {/* Field 2: Blockers (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="blockers-input"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <AlertCircle size={14} className="size-3.5 w-3.5 h-3.5 text-amber-500" />
                  Blockers <span className="text-slate-400 lowercase font-normal">(optional)</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">{blockers.length} chars</span>
              </div>
              <textarea
                id="blockers-input"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                rows={2}
                placeholder="e.g. Waiting on empty-state Figma designs from UX, need access to prod logs..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-sans leading-relaxed resize-y"
              />
            </div>

            {/* Field 3: Plans for today/tomorrow (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="plans-input"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Clock size={14} className="size-3.5 w-3.5 h-3.5 text-cyan-500" />
                  Plans for today / tomorrow{" "}
                  <span className="text-slate-400 lowercase font-normal">(optional)</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">{plans.length} chars</span>
              </div>
              <textarea
                id="plans-input"
                value={plans}
                onChange={(e) => setPlans(e.target.value)}
                rows={2}
                placeholder="e.g. Wire up dashboard filter UI, start invoice export endpoint..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-sans leading-relaxed resize-y"
              />
            </div>
          </div>

          {/* Validation or Error Warnings */}
          {hasCodeOrMarkup && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="size-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Plain language only:</strong> Code fences or scripts detected. Please describe your work in everyday words.
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="size-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Ticket Counter / Progress Message */}
            <div className="text-xs flex items-center gap-2">
              {renderTicketMessage()}
            </div>

            {/* Buttons depending on Auth and Ticket Status */}
            <div>
              {authStatus === "loading" ? (
                <div className="w-36 h-11 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ) : !session?.user ? (
                <button
                  type="button"
                  onClick={() => signIn(undefined, { callbackUrl: "/" })}
                  id="generator-signin-btn"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-slate-900 dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-sm cursor-pointer"
                >
                  <svg
                    className="size-4 w-4 h-4 shrink-0"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google to Generate</span>
                  <ArrowRight size={16} className="size-4 w-4 h-4" />
                </button>
              ) : ticketsLeft === 0 ? (
                <a
                  href={requestTicketsMailto}
                  id="request-more-tickets-btn"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 transition shadow-md cursor-pointer"
                >
                  <Mail size={16} className="size-4 w-4 h-4" />
                  <span>Request More Tickets</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleGenerate("generate")}
                  disabled={isGenerating || !done.trim() || isOverLimit || hasCodeOrMarkup}
                  id="generate-standup-btn"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-md shadow-blue-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="size-4 w-4 h-4 animate-spin" />
                      <span>Writing your standup...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="size-4 w-4 h-4" />
                      <span>Generate Standup</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Skeleton loading display while generating */}
          {isGenerating && (
            <div className="mt-8 p-6 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 animate-pulse space-y-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold">
                <Loader2 size={16} className="size-4 w-4 h-4 animate-spin" />
                <span>Writing your standup. This takes a few seconds...</span>
              </div>
              <div className="h-4 bg-blue-200/60 dark:bg-blue-900/40 rounded w-3/4" />
              <div className="h-4 bg-blue-200/60 dark:bg-blue-900/40 rounded w-1/2" />
              <div className="h-4 bg-blue-200/60 dark:bg-blue-900/40 rounded w-5/6" />
            </div>
          )}

          {/* Generated Cards */}
          {output && !isGenerating && (
            <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
              <StandupCards
                data={output}
                onChange={setOutput}
                onRegenerate={() => handleGenerate("regenerate")}
                isGenerating={isGenerating}
                onCopySuccess={handleCopySuccess}
              />

              {/* Tweak Box */}
              <TweakBox
                onApplyTweak={(instruction) => handleGenerate("tweak", instruction)}
                isGenerating={isGenerating}
                disabled={ticketsLeft === 0}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
