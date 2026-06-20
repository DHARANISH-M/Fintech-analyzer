import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  LayoutDashboard,
  FileSpreadsheet,
  LineChart,
  FileText,
  AlertTriangle,
  Bell,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchDocuments, fetchTransactions, fetchAlerts } from "@/lib/finance-api";

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const [docCount, setDocCount] = useState(1);
  const [txCount, setTxCount] = useState(22);
  const [alertCount, setAlertCount] = useState(3);
  
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Load counts dynamically
  const loadCounts = async () => {
    try {
      const { documents } = await fetchDocuments();
      setDocCount(documents.length);

      const { transactions } = await fetchTransactions();
      setTxCount(transactions.length);

      const { alerts } = await fetchAlerts();
      setAlertCount(alerts.length);
    } catch (e) {
      console.error("Failed to load sidebar counts:", e);
    }
  };

  useEffect(() => {
    void loadCounts();
    // Refresh numbers whenever document changes
    window.addEventListener("storage", loadCounts);
    window.addEventListener("document-change", loadCounts);
    return () => {
      window.removeEventListener("storage", loadCounts);
      window.removeEventListener("document-change", loadCounts);
    };
  }, []);

  const handleNotificationClick = () => {
    toast.message("Notifications Inbox", {
      description: `You have ${alertCount} unresolved statement flags awaiting validation.`,
    });
  };

  return (
    <aside className="w-full md:w-[270px] bg-sidebar border-r border-sidebar-border h-full flex flex-col font-sans select-none relative">
      {/* 1. HEADER / STATIC WORKSPACE TITLE */}
      <div className="border-b border-sidebar-border px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Logo Icon */}
          <div className="w-6 h-6 bg-primary text-primary-foreground rounded flex items-center justify-center font-bold text-xs flex-shrink-0">
            L
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs font-bold text-foreground tracking-tight leading-none">
              LedgerLens
            </h1>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-medium">
              Personal workspace
            </p>
          </div>
        </div>
      </div>

      {/* Main scrolling section */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        
        {/* 2. PRIMARY NAV SECTION - STATICALLY OPEN */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Workspace
            </span>
          </div>

          <nav className="space-y-0.5 pt-1">
            {[
              { label: "Overview", href: "/enhanced/dashboard", icon: LayoutDashboard },
              { label: "Transactions", href: "/enhanced/transactions", icon: FileSpreadsheet, badge: txCount },
              { label: "Analytics", href: "/enhanced/analytics", icon: LineChart },
              { label: "Documents", href: "/enhanced/documents", icon: FileText, badge: docCount },
              { label: "Alerts", href: "/enhanced/alerts", icon: AlertTriangle, badge: alertCount > 0 ? "dot" : undefined },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md transition-all text-xs font-medium group",
                    isActive
                      ? "bg-card border border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sub-border/30"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge === "dot" ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                  ) : item.badge !== undefined ? (
                    <span className="text-[10px] text-muted-foreground font-mono">{item.badge}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

      </div>

      {/* 5. SPACER -> handled by flex layout container */}

      {/* 6. FOOTER BLOCK (stacked at bottom) */}
      <div className="border-t border-sidebar-border p-3 space-y-3 bg-sidebar flex-shrink-0">
        
        {/* Notifications Row */}
        <button
          onClick={handleNotificationClick}
          className="w-full flex items-center justify-between p-2 rounded-md hover:bg-sub-border/30 transition-colors text-left group"
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">Notifications</span>
          </div>
          {alertCount > 0 && (
            <span className="inline-flex items-center justify-center bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono min-w-5 h-5">
              {alertCount}
            </span>
          )}
        </button>

        {/* Theme Toggle Row */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-2 rounded-md hover:bg-sub-border/30 transition-colors text-left group"
        >
          <div className="flex items-center gap-2.5">
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <Sun className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
              {theme === "light" ? "Dark mode" : "Light mode"}
            </span>
          </div>
        </button>

        {/* User profile row */}
        <div className="flex items-center justify-between p-2 rounded-md bg-card border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-sub-card border border-sub-border text-foreground font-semibold text-xs flex items-center justify-center uppercase flex-shrink-0">
              DS
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {localStorage.getItem("user_name") || "Deepan S."}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="text-[9px] text-success font-semibold">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade / limits card */}
        <div className="p-3 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
            <span>Limits: statements</span>
            <span className="font-mono text-foreground">{docCount}/10</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-sub-border h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (docCount / 10) * 100)}%` }}
            />
          </div>

          <Link
            to="/enhanced/settings"
            onClick={onCloseMobile}
            className="w-full flex items-center justify-center gap-1.5 bg-foreground hover:bg-foreground/90 text-background py-2 px-3 rounded-lg text-xs font-semibold transition-colors duration-150 shadow-sm text-center"
          >
            <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>Update profile</span>
          </Link>
        </div>

      </div>
    </aside>
  );
}
