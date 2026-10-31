"use client";

import React, { useState, useEffect } from "react";
import {
  History as HistoryIcon,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Calendar,
  Clock,
} from "lucide-react";
import { StandupCardsData } from "./standup-cards";

export interface HistoryItem {
  id: string;
  createdAt: string;
  input: { done: string; blockers: string; plans: string };
  output: StandupCardsData;
}

interface HistoryProps {
  lastGeneratedItem?: HistoryItem | null;
}

export function History({ lastGeneratedItem }: HistoryProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("standupflow_history");
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      console.warn("Could not load standup history from localStorage.");
    }
  }, [lastGeneratedItem]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    try {
      localStorage.setItem("standupflow_history", JSON.stringify(updated));
    } catch {
      console.warn("Could not update standup history in localStorage.");
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all saved standup history?")) {
      setItems([]);
      try {
        localStorage.removeItem("standupflow_history");
      } catch {
        // safe ignore
      }
    }
  };

  const handleCopy = async (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <section id="history" className="py-16 border-t border-slate-200/60 dark:border-slate-800/60 scroll-mt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <HistoryIcon size={16} className="size-4 w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Standup History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stored privately in your browser ({items.length} saved)
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              id="clear-history-btn"
              className="text-xs font-semibold text-slate-500 hover:text-red-500 transition px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center bg-slate-50/50 dark:bg-slate-900/30">
            <Clock size={28} className="size-7 w-7 h-7 mx-auto mb-2 text-slate-400 opacity-60" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              No standups saved yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Generate your daily update using the generator above and each synthesized update will be preserved here in local browser storage.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isExpanded = expandedId === item.id;
              const firstLine = item.output.short || item.output.slack.split("\n")[0] || item.input.done;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Header row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 select-none"
                  >
                    <div className="flex items-center gap-3 overflow-hidden pr-2">
                      <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
                        <Calendar size={12} className="size-3 w-3 h-3" />
                        {formatDate(item.createdAt)}
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {firstLine}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleCopy(`${item.id}-short`, item.output.short, e)}
                        title="Copy short version"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        {copiedKey === `${item.id}-short` ? (
                          <Check size={14} className="size-3.5 w-3.5 h-3.5 text-emerald-500" />
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

                      {isExpanded ? (
                        <ChevronUp size={16} className="size-4 w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown size={16} className="size-4 w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            Slack Version
                          </span>
                          <button
                            onClick={(e) => handleCopy(`${item.id}-slack`, item.output.slack, e)}
                            className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `${item.id}-slack` ? "Copied" : "Copy Slack"}
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          {item.output.slack}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Email Version
                          </span>
                          <button
                            onClick={(e) => handleCopy(`${item.id}-email`, item.output.email, e)}
                            className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `${item.id}-email` ? "Copied" : "Copy Email"}
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          {item.output.email}
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
    </section>
  );
}
