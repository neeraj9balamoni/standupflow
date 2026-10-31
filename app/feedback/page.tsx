"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  MessageSquareHeart,
  Mail,
  ExternalLink,
  Bug,
  Lightbulb,
  Heart,
  HelpCircle,
  Info,
} from "lucide-react";

type FeedbackType = "Bug" | "Idea" | "Praise" | "Other";

const FEEDBACK_TYPES: { type: FeedbackType; icon: React.ReactNode; desc: string }[] = [
  {
    type: "Bug",
    icon: <Bug size={14} className="size-3.5 w-3.5 h-3.5 text-red-500" />,
    desc: "Something is broken",
  },
  {
    type: "Idea",
    icon: <Lightbulb size={14} className="size-3.5 w-3.5 h-3.5 text-amber-500" />,
    desc: "Feature suggestion",
  },
  {
    type: "Praise",
    icon: <Heart size={14} className="size-3.5 w-3.5 h-3.5 text-pink-500" />,
    desc: "What you love",
  },
  {
    type: "Other",
    icon: <HelpCircle size={14} className="size-3.5 w-3.5 h-3.5 text-blue-500" />,
    desc: "General inquiry",
  },
];

export default function FeedbackPage() {
  const { data: session } = useSession();
  const [type, setType] = useState<FeedbackType>("Bug");
  const [message, setMessage] = useState("");
  const [includeEmail, setIncludeEmail] = useState(true);

  const recipient = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";
  const userEmail = session?.user?.email || "";

  const trimmed = message.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 1000;

  // Build plain text email body
  const emailBody = [
    trimmed,
    "",
    "---",
    `Type: ${type}`,
    includeEmail && userEmail ? `Reply-to Email: ${userEmail}` : null,
    `Submitted from StandupFlow Web App`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const subject = `StandupFlow feedback: ${type}`;

  const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

  const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  const canOpenEmail = isValid && Boolean(recipient);

  return (
    <div className="page-transition py-12 sm:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="route-intro-heading flex items-center gap-3 pb-8 border-b border-slate-200 dark:border-slate-800 mb-8">
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center shadow-xs">
            <MessageSquareHeart size={20} className="size-5 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Share Feedback
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Help us improve Standup Flow. All messages go straight to the creators.
            </p>
          </div>
        </div>

        {/* Feedback Form Card */}
        <div className="route-intro-content scroll-reveal p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* 1. Feedback Type Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              What kind of feedback do you have?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {FEEDBACK_TYPES.map((item) => {
                const isSelected = type === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setType(item.type)}
                    id={`feedback-type-${item.type.toLowerCase()}`}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20"
                        : "bg-slate-50/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {item.icon}
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Message textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="feedback-message"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Your Message <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  message.length > 1000
                    ? "text-red-500 font-bold"
                    : "text-slate-400"
                }`}
              >
                {message.length} / 1000
              </span>
            </div>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={6}
              placeholder="Tell us what happened, share an idea for Wispr Flow integration, or say hello..."
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition leading-relaxed resize-y font-sans"
            />
          </div>

          {/* 3. Include Email Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="include-email-checkbox"
              checked={includeEmail}
              onChange={(e) => setIncludeEmail(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
            />
            <label
              htmlFor="include-email-checkbox"
              className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none leading-relaxed"
            >
              Include my Google email address so you can reply back to me
              {userEmail && (
                <span className="font-mono text-slate-400 ml-1">
                  ({userEmail})
                </span>
              )}
            </label>
          </div>

          {/* Friendly Note */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <Info size={16} className="size-4 w-4 shrink-0 text-blue-500" />
            <span>
              This opens a draft in your email client. Press send to deliver it to{" "}
              <strong className="font-mono text-slate-700 dark:text-slate-300">
                {recipient || "Set NEXT_PUBLIC_CONTACT_EMAIL to enable email drafts"}
              </strong>
              .
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href={canOpenEmail ? gmailUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              id="open-in-gmail-btn"
              className={`w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white transition shadow-sm ${
                canOpenEmail
                  ? "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 cursor-pointer"
                  : "bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed pointer-events-none"
              }`}
            >
              <ExternalLink size={16} className="size-4 w-4" />
              <span>Open in Gmail</span>
            </a>

            <a
              href={canOpenEmail ? mailtoUrl : undefined}
              id="open-in-email-app-btn"
              className={`w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition border ${
                canOpenEmail
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-xs"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed pointer-events-none"
              }`}
            >
              <Mail size={16} className="size-4 w-4" />
              <span>Open in email app</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
