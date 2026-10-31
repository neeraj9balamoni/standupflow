"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Flame,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useStandupStore } from "@/components/store";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerMotionPreference() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference
  );
}

function CountUp({
  value,
  prefix = "",
  suffix = "",
  className = "",
  reduceMotion,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  reduceMotion: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduceMotion || value === 0) return;

    const startedAt = performance.now();
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, value]);
  const displayCount = reduceMotion ? value : count;

  return (
    <span
      className={className}
      aria-label={`${prefix}${value.toLocaleString()}${suffix}`}
      style={{
        fontVariantNumeric: "tabular-nums",
        minWidth: suffix === "%" ? "0" : suffix ? "9ch" : "6ch",
      }}
    >
      <span aria-hidden="true" className="inline-flex" style={{ perspective: 400 }}>
        {prefix && <span>{prefix}</span>}
        {displayCount.toLocaleString().split("").map((digit, index) => (
          <span key={`${index}-${digit}`} className="metric-digit">
            {digit}
          </span>
        ))}
        {suffix && <span>{suffix}</span>}
      </span>
      <span className="sr-only">{prefix}{value.toLocaleString()}{suffix}</span>
    </span>
  );
}

function MetricCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <article
      className="metric-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {children}
    </article>
  );
}

export default function InsightsPage() {
  const {
    metrics,
    estimatedTimeSavedMinutes,
    estimatedEffortReducedPct,
  } = useStandupStore();
  const reduceMotion = usePrefersReducedMotion();
  const spokenWords = metrics.inputWords;
  const writtenWords = metrics.copiedWords;
  const barMaximum = Math.max(spokenWords, writtenWords, 1);
  const ringCircumference = 2 * Math.PI * 42;
  const ringOffset =
    ringCircumference * (1 - estimatedEffortReducedPct / 100);
  const anyActivity = metrics.standupsCount > 0;

  return (
    <div className="page-transition py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="route-intro-heading mb-8 flex flex-col gap-4 border-b border-slate-200 pb-8 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-xs dark:bg-blue-950 dark:text-blue-400">
              <BarChart3 size={20} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Smarter Together
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Your private progress and estimated time savings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:self-auto">
            <ShieldCheck size={14} className="metric-icon text-emerald-500" aria-hidden="true" />
            <span>Private to your browser</span>
          </div>
        </div>

        <div className="route-intro-content scroll-reveal grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Standups generated
              </span>
              <div className="metric-icon flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/60">
                <Sparkles size={18} aria-hidden="true" />
              </div>
            </div>
            <CountUp
              value={metrics.standupsCount}
              reduceMotion={reduceMotion}
              className="block text-4xl font-black text-slate-900 dark:text-white"
            />
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Updates you have created
            </p>
          </MetricCard>

          <MetricCard>
            <div className="mb-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Time saved
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                estimate
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex size-[4.5rem] shrink-0 items-center justify-center rounded-full bg-emerald-50 shadow-[0_8px_20px_-10px_rgba(16,185,129,0.65)] dark:bg-emerald-950/60"
                aria-hidden="true"
              >
                <svg viewBox="0 0 48 48" className="size-14">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-200 dark:text-emerald-900" />
                  <path d="M24 7v4M41 24h-4M24 41v-4M7 24h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-400" />
                  <g
                    style={{
                      transform: `rotate(${(estimatedTimeSavedMinutes % 60) * 6}deg)`,
                      transformOrigin: "24px 24px",
                      transition: reduceMotion ? "none" : "transform 1.2s ease-out",
                    }}
                  >
                    <line x1="24" y1="25" x2="24" y2="11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-emerald-600 dark:text-emerald-400" />
                    <circle cx="24" cy="24" r="2" fill="currentColor" className="text-emerald-600 dark:text-emerald-400" />
                  </g>
                </svg>
              </div>
              <CountUp
                value={estimatedTimeSavedMinutes}
                prefix="~"
                suffix=" min"
                reduceMotion={reduceMotion}
                className="text-3xl font-black text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              Based on your dictation and copied updates
            </p>
          </MetricCard>

          <MetricCard>
            <div className="mb-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Effort reduced
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                estimate
              </span>
            </div>
            <div className="relative mx-auto flex size-28 items-center justify-center">
              <svg viewBox="0 0 100 100" className="size-24 -rotate-90 drop-shadow-[0_8px_10px_rgba(99,102,241,0.2)]" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-indigo-100 dark:text-indigo-950" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  style={{
                    strokeDashoffset: ringOffset,
                    transition: reduceMotion ? "none" : "stroke-dashoffset 1.2s ease-out",
                  }}
                  className="effort-ring text-indigo-500"
                />
              </svg>
              <CountUp
                value={estimatedEffortReducedPct}
                prefix="~"
                suffix="%"
                reduceMotion={reduceMotion}
                className="absolute text-2xl font-black text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
              Less time spent polishing updates
            </p>
          </MetricCard>

          <MetricCard>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active streak
              </span>
              <Flame className="flame-glow metric-icon size-8 text-amber-500" aria-hidden="true" />
            </div>
            <CountUp
              value={metrics.streakDays}
              reduceMotion={reduceMotion}
              className="block text-4xl font-black text-amber-500"
            />
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {metrics.streakDays === 1 ? "day in a row" : "days in a row"}
            </p>
          </MetricCard>
        </div>

        <div className="scroll-reveal mt-6 grid gap-6 lg:grid-cols-12">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:col-span-7">
            <div className="mb-6 flex items-start gap-3">
              <div className="metric-icon flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/60">
                <Mic size={19} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Words, made clearer
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your spoken notes and polished updates
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  You said
                </span>
                <CountUp
                  value={spokenWords}
                  reduceMotion={reduceMotion}
                  className="mt-1 block text-2xl font-black text-slate-900 dark:text-white"
                />
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/40">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  We wrote
                </span>
                <CountUp
                  value={writtenWords}
                  reduceMotion={reduceMotion}
                  className="mt-1 block text-2xl font-black text-blue-600 dark:text-blue-400"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4" aria-label="Word count comparison">
              <div className="relative h-24 overflow-hidden rounded-xl bg-slate-100 shadow-inner dark:bg-slate-950">
                <div
                  style={{
                    transform: `scaleY(${spokenWords / barMaximum})`,
                    transformOrigin: "bottom",
                    transitionDuration: reduceMotion ? "0ms" : "900ms",
                    transitionDelay: reduceMotion ? "0ms" : "200ms",
                  }}
                  className="word-bar-fill absolute inset-x-0 bottom-0 h-full rounded-xl bg-gradient-to-t from-blue-700 to-cyan-400 shadow-[0_0_24px_rgba(59,130,246,0.3)]"
                />
              </div>
              <div className="relative h-24 overflow-hidden rounded-xl bg-blue-50 shadow-inner dark:bg-blue-950/40">
                <div
                  style={{
                    transform: `scaleY(${writtenWords / barMaximum})`,
                    transformOrigin: "bottom",
                    transitionDuration: reduceMotion ? "0ms" : "900ms",
                    transitionDelay: reduceMotion ? "0ms" : "350ms",
                  }}
                  className="word-bar-fill absolute inset-x-0 bottom-0 h-full rounded-xl bg-gradient-to-t from-indigo-700 to-sky-400 shadow-[0_0_24px_rgba(99,102,241,0.3)]"
                />
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4 text-center text-[11px] text-slate-400">
              <span>You said</span>
              <span>We wrote</span>
            </div>
          </section>

          <section className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:col-span-5">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="metric-icon flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/60">
                  <Clock size={19} aria-hidden="true" />
                </div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  How savings are estimated
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Estimates assume typing at 40 words/min and speaking at 150 words/min.
              </p>
              {!anyActivity && (
                <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                  Your metrics will grow as you create and copy standups.
                </p>
              )}
            </div>
            <Link
              href="/"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <span>Generate today&apos;s update</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
