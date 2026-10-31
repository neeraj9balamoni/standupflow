"use client";

import React from "react";
import { Mic, Cpu, Copy, ArrowRight } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: <Mic size={24} className="size-6 w-6 h-6 text-blue-500" />,
      title: "Speak your messy notes",
      desc: "Tap your Wispr Flow shortcut or type freely into the plain textareas. No formatting needed—just raw thoughts on work, blockers, and plans.",
    },
    {
      num: "02",
      icon: <Cpu size={24} className="size-6 w-6 h-6 text-indigo-500" />,
      title: "One click senior synthesis",
      desc: "Google Gemini Flash turns your dump into three calibrated formats (Slack, Formal Email, Short Summary) strictly faithful to what you said.",
    },
    {
      num: "03",
      icon: <Copy size={24} className="size-6 w-6 h-6 text-cyan-500" />,
      title: "Review, edit & ship",
      desc: "Every card is an editable plain textarea. Copy in one click with instant feedback, or open the formal email directly in your email client.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-t border-slate-200/60 dark:border-slate-800/60 scroll-mt-24 scroll-reveal">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Frictionless Flow
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            How Standup Flow Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3">
            Designed for engineers who hate writing standup updates. Done in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div
              key={step.num}
              className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 shadow-xs hover:border-blue-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-300 dark:text-slate-700">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-slate-300 dark:text-slate-700">
                  <ArrowRight size={24} className="size-6 w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
