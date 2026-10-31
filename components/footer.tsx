"use client";

import React from "react";
import Link from "next/link";
import { Shield, Sparkles, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="scroll-reveal border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 text-slate-500 dark:text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-8">
          {/* Col 1 */}
          <div className="md:col-span-5 space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-base hover:opacity-90 transition"
            >
              <Sparkles size={16} className="size-4 w-4 h-4 text-blue-500" />
              <span>Standup Flow</span>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed">
              Designed and developed with the help of Wispr Flow. Speak messy, rush your thoughts, ship senior.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-2">
            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Navigation
            </span>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/history"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Standup History
                </Link>
              </li>
              <li>
                <Link
                  href="/insights"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Smarter Together Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/feedback"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Privacy promise */}
          <div className="md:col-span-4 space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
              <Shield size={16} className="size-4 w-4 h-4 text-emerald-500" />
              <span>Privacy &amp; Data Promise</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              We store an anonymous account ID and usage counts only to enforce weekly
              limits. Your notes and generated standups are never persisted on our servers.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div className="flex items-center gap-2">
            <span>&copy; 2026 StandupFlow. Released under the MIT License.</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition"
            >
              <svg
                className="size-3.5 w-3.5 h-3.5 fill-current shrink-0"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
            <span className="flex items-center gap-1">
              Built with <Heart size={12} className="size-3 w-3 h-3 text-red-500 fill-current" /> for developers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
