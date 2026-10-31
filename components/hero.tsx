"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  Mic,
  Sparkles,
  ArrowDown,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Eye,
  Mail,
  MessageSquare,
  AlignLeft,
  X,
} from "lucide-react";

export function Hero() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  const scrollToGenerator = () => {
    const el = document.getElementById("generator");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!isPreviewOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const triggerButton = previewButtonRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsPreviewOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      triggerButton?.focus();
    };
  }, [isPreviewOpen]);

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-visible">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/10 to-cyan-400/15 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Pill Tag */}
            <div className="home-intro-tag inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-6">
              <Mic size={14} className="size-3.5 w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Voice-First Standup Flow using Wispr Flow</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] mb-6">
              Speak it messy.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400">
                Send it sharp.
              </span>
            </h1>

            {/* Pitch / Subtitle */}
            <p className="home-intro-copy text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-xl">
              Turn messy spoken work notes into senior-grade standup updates in
              seconds. One click produces tailored outputs for <strong>Slack</strong>,{" "}
              <strong>formal management emails</strong>, and <strong>concise summaries</strong>.
              Zero fluff, zero invented facts.
            </p>

            {/* CTA Group */}
            <div className="home-intro-actions flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={scrollToGenerator}
                id="hero-try-btn"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Zap size={16} className="size-4 w-4 h-4 fill-current" />
                <span>Try Generator</span>
                <ArrowDown size={16} className="size-4 w-4 h-4" />
              </button>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition"
              >
                <span>How it works</span>
              </a>
            </div>

            {/* Trust badges */}
            <div className="home-intro-trust flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="size-4 w-4 h-4 text-emerald-500" />
                <span>Senior Engineer Voice</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="size-4 w-4 h-4 text-blue-500" />
                <span>Strict Fact Faithfulness</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="size-4 w-4 h-4 text-cyan-400" />
                <span>Powered by Gemini</span>
              </div>
            </div>
          </div>

          <LayoutGroup id="hero-preview">
            <div className="home-intro-card lg:col-span-5 flex justify-center relative w-full">
              <motion.button
                ref={previewButtonRef}
                type="button"
                layoutId="hero-preview-card"
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
                aria-haspopup="dialog"
                aria-expanded={isPreviewOpen}
                aria-label="Tap to preview example outputs"
                onClick={() => setIsPreviewOpen(true)}
                className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white/90 p-5 text-left shadow-xl backdrop-blur-md transition-colors hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700"
              >
                <span className="flex flex-col gap-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    <MessageSquare size={16} aria-hidden="true" />
                    Slack
                  </span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    <Mail size={16} aria-hidden="true" />
                    Formal Email
                  </span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                    <AlignLeft size={16} aria-hidden="true" />
                    Quick Summary
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 border-t border-slate-200 pt-3 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <Eye size={13} aria-hidden="true" />
                    Tap to preview
                  </span>
                </span>
              </motion.button>
            </div>
            {isPreviewOpen &&
              typeof document !== "undefined" &&
              createPortal(
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25 }}
                  onClick={(event) => {
                    if (event.target === event.currentTarget) {
                      setIsPreviewOpen(false);
                    }
                  }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
                >
                  <motion.div
                    ref={dialogRef}
                    layoutId="hero-preview-card"
                    initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.25,
                      ease: "easeOut",
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Example output preview"
                    tabIndex={-1}
                    className="relative max-h-[85vh] w-[min(720px,92vw)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/30 dark:border-slate-700 dark:bg-slate-900 sm:p-7"
                  >
                        <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            Example output
                          </span>
                          <button
                            ref={closeButtonRef}
                            type="button"
                            onClick={() => setIsPreviewOpen(false)}
                            aria-label="Close preview"
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <X size={18} aria-hidden="true" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                              <MessageSquare size={15} aria-hidden="true" />
                              Slack
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              Yesterday I resolved the auth cookie redirect loop. Also kicked off dashboard filters. Today I&apos;ll finish the filter UI. Blocked: waiting on empty-state design from UX.
                            </p>
                          </section>

                          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              <Mail size={15} aria-hidden="true" />
                              Formal Email
                            </h2>
                            <p className="text-sm italic leading-relaxed text-slate-600 dark:text-slate-300">
                              &quot;Subject: Daily Engineering Update... Hi team, yesterday I resolved the auth cookie redirect loop. I kicked off dashboard filters and will finish the filter UI today. I&apos;m blocked waiting on empty-state design from UX.&quot;
                            </p>
                          </section>

                          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400">
                              <AlignLeft size={15} aria-hidden="true" />
                              Quick Summary
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              Resolved the auth cookie redirect loop, kicked off dashboard filters, and will finish the filter UI today. Blocked on empty-state design from UX.
                            </p>
                          </section>
                        </div>
                  </motion.div>
                </motion.div>,
                document.body
              )}
          </LayoutGroup>
        </div>
      </div>
    </section>
  );
}
