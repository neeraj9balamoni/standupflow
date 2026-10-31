"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useSession } from "next-auth/react";
import { StandupCardsData } from "./standup-cards";

export interface HistoryItem {
  id: string;
  createdAt: string;
  input: { done: string; blockers: string; plans: string };
  output: StandupCardsData;
}

export interface DashboardMetrics {
  standupsCount: number;
  inputWords: number;
  copiedWords: number;
  streakDays: number;
  lastCopiedDate: string | null;
}

interface ToastInfo {
  visible: boolean;
  timeSavedMinutes: number;
}

interface StandupStoreContextType {
  history: HistoryItem[];
  addHistoryItem: (item: HistoryItem) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
  metrics: DashboardMetrics;
  recordCopy: (
    type: string,
    copiedText: string,
    inputWordsCount: number
  ) => void;
  estimatedTimeSavedMinutes: number;
  estimatedEffortReducedPct: number;
  ticketsLeft: number | null;
  ticketsTotal: number | null;
  setTickets: (left: number, total: number) => void;
  refreshTickets: () => Promise<void>;
  toastInfo: ToastInfo;
  showToast: (timeSavedMinutes: number) => void;
  dismissToast: () => void;
}

const HISTORY_KEY = "standupflow_history";
const METRICS_KEY = "standupflow_dashboard_metrics";
const STORE_EVENT = "standupflow_store_change";

const DEFAULT_METRICS: DashboardMetrics = {
  standupsCount: 0,
  inputWords: 0,
  copiedWords: 0,
  streakDays: 0,
  lastCopiedDate: null,
};

function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Could not read ${key} from localStorage:`, err);
    return fallback;
  }
}

function safeSetItem(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key } }));
  } catch (err) {
    console.warn(`Could not write ${key} to localStorage:`, err);
  }
}

export function calculateEstimatedSavings(
  inputWords: number,
  copiedWords: number
) {
  // Manual composing: ~40 wpm + 1 min friction
  const manualMinutes = copiedWords > 0 ? copiedWords / 40 + 1 : 0;
  // Flow dictation: ~150 wpm + 30s review
  const flowMinutes = inputWords > 0 ? inputWords / 150 + 0.5 : 0;
  const timeSaved = Math.max(0, manualMinutes - flowMinutes);
  const effortPct =
    manualMinutes > 0
      ? Math.min(90, Math.max(0, Math.round((timeSaved / manualMinutes) * 100)))
      : 0;

  return {
    estimatedTimeSavedMinutes: Math.round(timeSaved),
    estimatedEffortReducedPct: effortPct,
  };
}

const StandupStoreContext = createContext<StandupStoreContextType | null>(null);

export function StandupStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [ticketsLeft, setTicketsLeftState] = useState<number | null>(null);
  const [ticketsTotal, setTicketsTotalState] = useState<number | null>(6);
  const [toastInfo, setToastInfo] = useState<ToastInfo>({
    visible: false,
    timeSavedMinutes: 0,
  });

  // Load state from localStorage on client mount
  const syncFromStorage = useCallback(() => {
    const storedHistory = safeGetItem<HistoryItem[]>(HISTORY_KEY, []);
    const storedMetrics = safeGetItem<DashboardMetrics>(
      METRICS_KEY,
      DEFAULT_METRICS
    );
    setHistory(storedHistory);
    setMetrics(storedMetrics);
  }, []);

  useEffect(() => {
    syncFromStorage();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === HISTORY_KEY || e.key === METRICS_KEY || !e.key) {
        syncFromStorage();
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (
        !customEvent.detail?.key ||
        customEvent.detail.key === HISTORY_KEY ||
        customEvent.detail.key === METRICS_KEY
      ) {
        syncFromStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(STORE_EVENT, handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STORE_EVENT, handleCustomChange);
    };
  }, [syncFromStorage]);

  // Fetch ticket status when session is active
  const refreshTickets = useCallback(async () => {
    if (!session?.user) {
      setTicketsLeftState(null);
      return;
    }
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.ticketsLeft === "number") {
          setTicketsLeftState(data.ticketsLeft);
          setTicketsTotalState(data.ticketsTotal ?? 6);
        }
      }
    } catch (err) {
      console.warn("Could not load tickets:", err);
    }
  }, [session]);

  useEffect(() => {
    refreshTickets();
  }, [refreshTickets]);

  const setTickets = useCallback((left: number, total: number) => {
    setTicketsLeftState(left);
    setTicketsTotalState(total);
  }, []);

  const addHistoryItem = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev.slice(0, 49)];
      safeSetItem(HISTORY_KEY, updated);
      return updated;
    });

    setMetrics((current) => {
      const updated: DashboardMetrics = {
        ...current,
        standupsCount: current.standupsCount + 1,
      };
      safeSetItem(METRICS_KEY, updated);
      return updated;
    });
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      safeSetItem(HISTORY_KEY, updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    safeSetItem(HISTORY_KEY, []);
  }, []);

  const showToast = useCallback((timeSavedMinutes: number) => {
    setToastInfo({
      visible: true,
      timeSavedMinutes: Math.max(3, timeSavedMinutes || 5),
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToastInfo({ visible: false, timeSavedMinutes: 0 });
  }, []);

  const recordCopy = useCallback(
    (type: string, copiedText: string, inputWordsCount: number) => {
      const copiedWords = copiedText
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

      setMetrics((current) => {
        const todayStr = new Date().toISOString().slice(0, 10);
        let newStreak = current.streakDays;

        if (!current.lastCopiedDate) {
          newStreak = 1;
        } else if (current.lastCopiedDate !== todayStr) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);

          if (current.lastCopiedDate === yesterdayStr) {
            newStreak = current.streakDays + 1;
          } else {
            newStreak = 1;
          }
        }

        const updated: DashboardMetrics = {
          ...current,
          streakDays: newStreak,
          lastCopiedDate: todayStr,
          inputWords: current.inputWords + inputWordsCount,
          copiedWords: current.copiedWords + copiedWords,
        };

        safeSetItem(METRICS_KEY, updated);
        return updated;
      });

      const { estimatedTimeSavedMinutes } = calculateEstimatedSavings(
        inputWordsCount,
        copiedWords
      );
      showToast(estimatedTimeSavedMinutes);
    },
    [showToast]
  );

  const { estimatedTimeSavedMinutes, estimatedEffortReducedPct } = useMemo(
    () =>
      calculateEstimatedSavings(metrics.inputWords, metrics.copiedWords),
    [metrics.inputWords, metrics.copiedWords]
  );

  const value = useMemo(
    () => ({
      history,
      addHistoryItem,
      deleteHistoryItem,
      clearHistory,
      metrics,
      recordCopy,
      estimatedTimeSavedMinutes,
      estimatedEffortReducedPct,
      ticketsLeft,
      ticketsTotal,
      setTickets,
      refreshTickets,
      toastInfo,
      showToast,
      dismissToast,
    }),
    [
      history,
      addHistoryItem,
      deleteHistoryItem,
      clearHistory,
      metrics,
      recordCopy,
      estimatedTimeSavedMinutes,
      estimatedEffortReducedPct,
      ticketsLeft,
      ticketsTotal,
      setTickets,
      refreshTickets,
      toastInfo,
      showToast,
      dismissToast,
    ]
  );

  return (
    <StandupStoreContext.Provider value={value}>
      {children}
    </StandupStoreContext.Provider>
  );
}

export function useStandupStore(): StandupStoreContextType {
  const context = useContext(StandupStoreContext);
  if (!context) {
    throw new Error(
      "useStandupStore must be used within a StandupStoreProvider"
    );
  }
  return context;
}
