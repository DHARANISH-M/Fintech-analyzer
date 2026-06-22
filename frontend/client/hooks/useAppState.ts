import { useEffect, useState, useCallback } from "react";
import { fetchAlerts, fetchDocuments, fetchTransactions } from "@/lib/finance-api";

export interface AppState {
  alertCount: number;
  docCount: number;
  txCount: number;
  theme: "light" | "dark";
  toggleTheme: () => void;
  userName: string;
  userEmail: string;
  userInitials: string;
  refreshCounts: () => Promise<void>;
}

// Singleton-like module-level state so multiple consumers share updates via storage events
let _theme: "light" | "dark" =
  (localStorage.getItem("theme") as "light" | "dark") || "light";

export function useAppState(): AppState {
  const [alertCount, setAlertCount] = useState(3);
  const [docCount, setDocCount] = useState(1);
  const [txCount, setTxCount] = useState(22);
  const [theme, setTheme] = useState<"light" | "dark">(_theme);

  const userName = localStorage.getItem("user_name") || "Deepan S.";
  const userEmail = localStorage.getItem("user_email") || "deepan@ledgerlens.io";

  // Derive initials from name
  const userInitials = userName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");

  const refreshCounts = useCallback(async () => {
    try {
      const [{ documents }, { transactions }, { alerts }] = await Promise.all([
        fetchDocuments(),
        fetchTransactions(),
        fetchAlerts(),
      ]);
      setDocCount(documents.length);
      setTxCount(transactions.length);
      setAlertCount(alerts.length);
    } catch (e) {
      console.error("Failed to load app state counts:", e);
    }
  }, []);

  useEffect(() => {
    void refreshCounts();
    window.addEventListener("storage", refreshCounts);
    window.addEventListener("document-change", refreshCounts);
    return () => {
      window.removeEventListener("storage", refreshCounts);
      window.removeEventListener("document-change", refreshCounts);
    };
  }, [refreshCounts]);

  // Sync theme from storage (for cross-tab/local updates support)
  useEffect(() => {
    const handler = () => {
      const stored = (localStorage.getItem("theme") as "light" | "dark") || "light";
      setTheme(stored);
      _theme = stored;
      document.documentElement.setAttribute("data-theme", stored);
    };
    window.addEventListener("storage", handler);
    // Listen for custom event within same window
    window.addEventListener("theme-change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("theme-change", handler);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    _theme = next;
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    // Notify other consumers in same tab
    window.dispatchEvent(new Event("theme-change"));
  }, [theme]);

  return {
    alertCount,
    docCount,
    txCount,
    theme,
    toggleTheme,
    userName,
    userEmail,
    userInitials,
    refreshCounts,
  };
}
