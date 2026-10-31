"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  History as HistoryIcon,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Calendar,
  Clock,
  Search,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Mail,
  AlignLeft,
} from "lucide-react";
import { useStandupStore } from "@/components/store";
import { CopyToast } from "@/components/copy-toast";

export default function HistoryPage() {
  const {
    history,
    deleteHistoryItem,
    clearHistory,
    recordCopy,
    toastInfo,
    dismissToast,
  } = useStandupStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopy = async (
    id: string,
    type: "slack" | "email" | "short",
    text: string,
    inputWordsCount: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(id);
      recordCopy(type, text, inputWordsCount);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistoryItem(id);
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all saved standup history?")) {
      clearHistory();
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase();
    return history.filter((item) => {
      const inDone = item.input.done?.toLowerCase().includes(q);
      const inBlockers = item.input.blockers?.toLowerCase().includes(q);
      const inPlans = item.input.plans?.toLowerCase().includes(q);
      const inSlack = item.output.slack?.toLowerCase().includes(q);
      const inEmail = item.output.email?.toLowerCase().includes(q);
      const inShort = item.output.short?.toLowerCase().includes(q);
      return inDone || inBlockers || inPlans || inSlack || inEmail || inShort;
    });
  }, [history, searchQuery]);

  return (
    <div className="page-transition py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="route-intro-heading flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-slate-200 dark:border-slate-800 gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <HistoryIcon size={20} className="size-5 w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Standup History
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Saved privately in your browser storage ({history.length} total)
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAll}
                id="clear-all-history-btn"
                className="text-xs font-semibold text-slate-500 hover:text-red-500 transition px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/50 cursor-pointer"
              >
                Clear all history
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
              >
                <Sparkles size={13} className="size-3.5 w-3.5 h-3.5" />
                <span>New Standup</span>
              </Link>
            </div>
          )}
        </div>

        {/* Search bar when history exists */}
        {history.length > 0 && (
          <div className="scroll-reveal mb-6 relative">
            <Search
              size={16}
              className="size-4 w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past standups by keyword, topic, or date..."
              id="history-search-input"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            />
          </div>
        )}

        {/* Empty state */}
        {history.length === 0 ? (
          <div className="scroll-reveal rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50/50 dark:bg-slate-900/30">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 mx-auto mb-4 flex items-center justify-center">
              <Clock size={28} className="size-7 w-7 h-7" />
            </div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              No standups in history yet
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
              When you generate standups from messy voice or typed notes, they
              will appear here automatically and remain stored safely in your
              browser.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
              >
                <span>Generate Your First Standup</span>
                <ArrowRight size={14} className="size-3.5 w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="scroll-reveal rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 text-sm">
            No standups match your search &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <div className="scroll-reveal space-y-4">
            {filteredHistory.map((item) => {
              const isExpanded = expandedId === item.id;
              const inputWords = `${item.input.done} ${item.input.blockers} ${item.input.plans}`
                .trim()
                .split(/\s+/)
                .filter(Boolean).length;
              const summaryLine =
                item.output.short ||
                item.output.slack.split("\n")[0] ||
                item.input.done;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 transition overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Item Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 select-none gap-4"
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                      <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400 shrink-0">
                        <Calendar size={13} className="size-3.5 w-3.5 h-3.5" />
                        {formatDate(item.createdAt)}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {summaryLine}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) =>
                          handleCopy(
                            `${item.id}-short`,
                            "short",
                            item.output.short,
                            inputWords,
                            e
                          )
                        }
                        title="Copy short version"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        {copiedKey === `${item.id}-short` ? (
                          <Check
                            size={14}
                            className="size-3.5 w-3.5 h-3.5 text-emerald-500"
                          />
                        ) : (
                          <Copy size={14} className="size-3.5 w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Delete entry"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Trash2 size={14} className="size-3.5 w-3.5 h-3.5" />
                      </button>

                      <div className="p-1 text-slate-400">
                        {isExpanded ? (
                          <ChevronUp size={16} className="size-4 w-4 h-4" />
                        ) : (
                          <ChevronDown size={16} className="size-4 w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content with 3 Formats */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/50 space-y-5 animate-in fade-in duration-150">
                      {/* Slack Format */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <MessageSquare size={13} className="size-3.5 w-3.5 h-3.5" />
                            Slack / Teams Format
                          </span>
                          <button
                            onClick={(e) =>
                              handleCopy(
                                `${item.id}-slack`,
                                "slack",
                                item.output.slack,
                                inputWords,
                                e
                              )
                            }
                            className="text-xs text-blue-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `${item.id}-slack` ? (
                              <span className="text-emerald-500">Copied!</span>
                            ) : (
                              "Copy Slack"
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          {item.output.slack}
                        </p>
                      </div>

                      {/* Email Format */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Mail size={13} className="size-3.5 w-3.5 h-3.5" />
                            Formal Management Email
                          </span>
                          <button
                            onClick={(e) =>
                              handleCopy(
                                `${item.id}-email`,
                                "email",
                                item.output.email,
                                inputWords,
                                e
                              )
                            }
                            className="text-xs text-indigo-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `${item.id}-email` ? (
                              <span className="text-emerald-500">Copied!</span>
                            ) : (
                              "Copy Email"
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          {item.output.email}
                        </p>
                      </div>

                      {/* Short Summary */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                            <AlignLeft size={13} className="size-3.5 w-3.5 h-3.5" />
                            Quick Summary
                          </span>
                          <button
                            onClick={(e) =>
                              handleCopy(
                                `${item.id}-short-inner`,
                                "short",
                                item.output.short,
                                inputWords,
                                e
                              )
                            }
                            className="text-xs text-cyan-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `${item.id}-short-inner` ? (
                              <span className="text-emerald-500">Copied!</span>
                            ) : (
                              "Copy Summary"
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          {item.output.short}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toastInfo.visible && (
        <CopyToast
          timeSavedMinutes={toastInfo.timeSavedMinutes}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}
