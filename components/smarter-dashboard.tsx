"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, ChevronDown, ChevronUp, Flame, Clock, Sparkles, TrendingUp } from "lucide-react";

export interface DashboardMetrics {
  standupsCount: number;
  inputWords: number;
  copiedWords: number;
  streakDays: number;
  lastCopiedDate: string | null;
}

const STORAGE_KEY = "standupflow_dashboard_metrics";

export function loadMetrics(): DashboardMetrics {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // safe ignore
  }
  return {
    standupsCount: 0,
    inputWords: 0,
    copiedWords: 0,
    streakDays: 0,
    lastCopiedDate: null,
  };
}

export function saveMetrics(metrics: DashboardMetrics) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // safe ignore
  }
}

export function calculateTimeSavings(inputWords: number, copiedWords: number) {
  const manualMinutes = copiedWords > 0 ? copiedWords / 40 + 1 : 0;
  const flowMinutes = inputWords > 0 ? inputWords / 150 + 0.5 : 0;
  const timeSavedMinutes = Math.max(0, manualMinutes - flowMinutes);
  const effortReducedPct =
    manualMinutes > 0
      ? Math.min(90, Math.max(0, Math.round((timeSavedMinutes / manualMinutes) * 100)))
      : 0;

  return {
    timeSavedMinutes: Math.round(timeSavedMinutes),
    effortReducedPct,
  };
}

export function SmarterDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    standupsCount: 0,
    inputWords: 0,
    copiedWords: 0,
    streakDays: 0,
    lastCopiedDate: null,
  });

  useEffect(() => {
    setMetrics(loadMetrics());
  }, []);

  const { timeSavedMinutes, effortReducedPct } = calculateTimeSavings(
    metrics.inputWords,
    metrics.copiedWords
  );

  return (
    <section id="smarter-together" className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 scroll-mt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Collapsed Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          id="smarter-dashboard-toggle-btn"
          className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-500/40 transition select-none cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart3 size={16} className="size-4 w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Smarter Together Dashboard
                <span className="text-[10px] font-mono text-slate-400 font-normal">
                  (Private to your browser)
                </span>
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {metrics.standupsCount === 0
                  ? "Open to see your estimated time saved and speech impact"
                  : `Estimated ${timeSavedMinutes} mins saved across ${metrics.standupsCount} standups`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span>{isOpen ? "Hide metrics" : "View metrics"}</span>
            {isOpen ? <ChevronUp size={16} className="size-4 w-4 h-4" /> : <ChevronDown size={16} className="size-4 w-4 h-4" />}
          </div>
        </button>

        {/* Expanded Dashboard Content */}
        {isOpen && (
          <div className="mt-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Estimated Impact Metrics
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                No server tracking • 100% localStorage
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Metric 1: Standups generated */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Sparkles size={14} className="size-3.5 w-3.5 h-3.5 text-blue-500" />
                  <span>Standups Generated</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {metrics.standupsCount}
                </div>
                <span className="text-[10px] text-slate-400">Updates shipped</span>
              </div>

              {/* Metric 2: Estimated Time Saved */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Clock size={14} className="size-3.5 w-3.5 h-3.5 text-emerald-500" />
                  <span>Estimated Time Saved</span>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {timeSavedMinutes}m
                </div>
                <span className="text-[10px] text-slate-400">Based on dictation vs typing</span>
              </div>

              {/* Metric 3: Estimated Effort Reduced */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <TrendingUp size={14} className="size-3.5 w-3.5 h-3.5 text-indigo-500" />
                  <span>Estimated Effort Saved</span>
                </div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {effortReducedPct}%
                </div>
                <span className="text-[10px] text-slate-400">Formatting friction eliminated</span>
              </div>

              {/* Metric 4: Daily Streak */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Flame size={14} className="size-3.5 w-3.5 h-3.5 text-amber-500" />
                  <span>Active Streak</span>
                </div>
                <div className="text-2xl font-black text-amber-500">
                  {metrics.streakDays} {metrics.streakDays === 1 ? "day" : "days"}
                </div>
                <span className="text-[10px] text-slate-400">Consecutive standup days</span>
              </div>
            </div>

            {/* Word Ratio Comparison */}
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-600 dark:text-slate-300">
                <strong>Raw spoken input:</strong> {metrics.inputWords} words &bull;{" "}
                <strong>Polished standup shipped:</strong> {metrics.copiedWords} words
              </div>
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                High-density synthesis
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
