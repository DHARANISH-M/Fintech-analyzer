import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Download,
  FileText
} from "lucide-react";

import { DashboardResponse, DocumentRecord, TransactionRecord } from "@shared/api";
import {
  fetchDashboard,
  fetchDocuments,
  fetchTransactions,
  fetchAlerts,
  downloadDocumentSpreadsheet,
  formatMoney
} from "@/lib/finance-api";

function StatCard({
  title,
  value,
  icon,
  tone = "default",
  badge,
  delta,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "success" | "danger";
  badge?: string;
  delta?: number | null;
}) {
  const valueClass = {
    default: "text-foreground",
    success: "text-success",
    danger: "text-destructive",
  }[tone];

  const iconContainerClass = {
    default: "bg-primary/10 border-primary/20 text-primary",
    success: "bg-success/10 border-success/20 text-success",
    danger: "bg-destructive/10 border-destructive/20 text-destructive",
  }[tone];

  const isNegative = delta !== undefined && delta !== null && delta < 0;
  const showDelta = delta !== undefined && delta !== null && !isNaN(delta);

  let deltaColorClass = "text-success";
  if (tone === "danger") {
    deltaColorClass = isNegative ? "text-success" : "text-destructive";
  } else {
    deltaColorClass = isNegative ? "text-destructive" : "text-success";
  }

  const deltaText = showDelta
    ? `${isNegative ? "↓" : "↑"} ${Math.abs(delta).toFixed(1)}% vs last month`
    : "";

  return (
    <article className="cursor-card p-6 transition-all duration-150 hover:border-sub-border hover:bg-sub-card/50">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className={`text-3xl font-heading font-normal tracking-tight ${valueClass}`}>{value}</p>
            {showDelta && (
              <span className={`text-[10px] font-semibold ${deltaColorClass} whitespace-nowrap`}>
                {deltaText}
              </span>
            )}
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center border rounded-md flex-shrink-0 ${iconContainerClass}`}>
          {icon}
        </div>
      </div>
      {badge ? <p className="mt-4 text-[10px] text-muted-foreground font-light lowercase">{badge}</p> : null}
    </article>
  );
}

function getRelativeTime(dateString: string): string {
  const targetDate = new Date(dateString);
  const now = new Date();

  const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = nowMidnight.getTime() - targetMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 0) return "in the future";
  return `${diffDays} days ago`;
}

function formatUploadDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatStatementPeriod(start?: string | null, end?: string | null): string {
  if (!start || !end) return "Period unknown";
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const yearOptions: Intl.DateTimeFormatOptions = { ...options, year: "numeric" };
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString("en-US", options)} – ${endDate.toLocaleDateString("en-US", yearOptions)}`;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-16 animate-pulse font-sans">
      {/* Header Skeleton */}
      <div className="cursor-card p-8 h-36 bg-sub-card/40 border-border" />
      {/* Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="cursor-card p-6 h-28 bg-sub-card/40 border-border" />
        ))}
      </div>
      {/* Recently Uploaded Documents Skeleton */}
      <div className="cursor-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-sub-card rounded" />
            <div className="h-3 w-64 bg-sub-card rounded" />
          </div>
          <div className="h-4 w-32 bg-sub-card rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-sub-card/40 border border-sub-border rounded-lg" />
          ))}
        </div>
      </div>
      {/* Cards Skeleton */}
      <div className="grid items-stretch gap-6 md:grid-cols-2">
        <div className="cursor-card p-6 h-96 bg-sub-card/40 border-border" />
        <div className="cursor-card p-6 h-96 bg-sub-card/40 border-border" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [docsData, setDocsData] = useState<DocumentRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const dashboardRes = await fetchDashboard();
      const docsRes = await fetchDocuments();
      const txsRes = await fetchTransactions();
      const alertsRes = await fetchAlerts();

      setData(dashboardRes);
      setDocsData(docsRes.documents);
      setTransactions(txsRes.transactions);
      setAlertsCount(alertsRes.alerts.length);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    void loadData();

    window.addEventListener("document-change", loadData);
    return () => {
      window.removeEventListener("document-change", loadData);
    };
  }, []);

  const ledgerRows = useMemo(() => data?.payeeLedger.slice(0, 8) ?? [], [data]);

  // Command Center 1: Action Needed Banner
  const bannerItems = useMemo(() => {
    if (isLoading || docsData.length === 0) return [];

    const items: Array<{ text: string; link: string; type: "warning" | "info" | "neutral" }> = [];

    // Transactions needing categorization
    const uncategorizedCount = transactions.filter(
      t => !t.category || t.category.toLowerCase() === "uncategorized"
    ).length;
    if (uncategorizedCount > 0) {
      items.push({
        text: `${uncategorizedCount} transaction${uncategorizedCount === 1 ? " needs" : "s need"} categorization`,
        link: "/enhanced/transactions",
        type: "warning",
      });
    }

    // Statements pending review
    const pendingCount = docsData.filter(
      d => d.extractionStatus === "uploaded" || d.extractionStatus === "processing"
    ).length;
    if (pendingCount > 0) {
      items.push({
        text: `${pendingCount} statement${pendingCount === 1 ? " is" : "s are"} pending review`,
        link: "/enhanced/documents",
        type: "warning",
      });
    }

    // Outdated warning
    const completedDocs = docsData.filter(d => d.extractionStatus === "completed");
    if (completedDocs.length > 0) {
      const sortedDocs = [...completedDocs].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      const latestDoc = sortedDocs[0];
      const diffTime = Math.abs(new Date().getTime() - new Date(latestDoc.uploadedAt).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        items.push({
          text: `Last statement uploaded ${diffDays} days ago — may be outdated`,
          link: "/enhanced/documents",
          type: "warning",
        });
      }
    }

    return items;
  }, [isLoading, docsData, transactions]);

  // Command Center 2: Workspace Stats Strip
  const statsStrip = useMemo(() => {
    if (docsData.length === 0) return "";
    const docsCount = docsData.length;
    const txCount = transactions.length;
    const accountsCount = new Set(transactions.map(t => t.documentId)).size || docsCount;

    return `${docsCount} statement${docsCount === 1 ? "" : "s"} · ${accountsCount} account${accountsCount === 1 ? "" : "s"} · ${txCount} transaction${txCount === 1 ? "" : "s"} tracked`;
  }, [docsData, transactions]);

  // Command Center 3: Comparison Deltas for Stat Cards
  const deltas = useMemo(() => {
    if (!data || data.monthlySeries.length < 2) return null;
    const current = data.monthlySeries[data.monthlySeries.length - 1];
    const previous = data.monthlySeries[data.monthlySeries.length - 2];

    const calculatePct = (curr: number, prev: number) => {
      if (!prev) return null;
      return ((curr - prev) / prev) * 100;
    };

    const balancePct = calculatePct(current.closingBalance ?? 0, previous.closingBalance ?? 0);
    const incomePct = calculatePct(current.income, previous.income);
    const expensesPct = calculatePct(current.expenses, previous.expenses);
    const netPct = previous.net !== 0 ? ((current.net - previous.net) / Math.abs(previous.net)) * 100 : null;

    return {
      balance: balancePct,
      income: incomePct,
      expenses: expensesPct,
      net: netPct,
    };
  }, [data]);

  // Command Center 4: Account Balances List
  const accountBalances = useMemo(() => {
    if (docsData.length <= 1) return [];

    return docsData.map(doc => {
      const docTxs = transactions.filter(t => t.documentId === doc.id);
      const sorted = [...docTxs].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      const latestBalance = sorted[0]?.balance ?? 0;
      return {
        id: doc.id,
        name: doc.fileName.replace(/\.pdf$/i, "").replace(/_statement/i, "").replace(/_/g, " "),
        balance: latestBalance,
      };
    });
  }, [docsData, transactions]);

  // Command Center 5: Sorted 5 Recent Transactions
  const sortedRecent = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Command Center 6: Recently Uploaded Documents
  const recentUploadedDocs = useMemo(() => {
    return [...docsData]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 5);
  }, [docsData]);

  // Quick Action triggers
  const handleExportLatest = async () => {
    if (docsData.length === 0) return;
    const sortedDocs = [...docsData].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    const latestDoc = sortedDocs[0];
    await downloadDocumentSpreadsheet(latestDoc.id, latestDoc.fileName);
  };

  const getStatusBadge = (status: DocumentRecord["extractionStatus"]) => {
    if (status === "completed") {
      return (
        <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Processed
        </span>
      );
    }
    if (status === "failed") {
      return (
        <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Needs review
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-muted-foreground bg-muted/10 border border-muted/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
        Processing
      </span>
    );
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="border border-destructive/25 bg-destructive/5 px-6 py-4 text-xs font-bold text-destructive uppercase tracking-wide rounded-md">
        {error}
      </div>
    );
  }

  // Dashboard Empty State
  if (docsData.length === 0) {
    return (
      <div className="space-y-6 pb-16 font-sans">
        <section className="cursor-card p-8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">GETTING STARTED</p>
          <h1 className="mt-2 text-3xl font-heading font-normal tracking-tight text-foreground lowercase">dashboard</h1>
          <p className="mt-2 text-sm leading-relaxed text-card-foreground font-light">
            Welcome to LedgerLens. Upload your first statement to initialize your local command center.
          </p>
        </section>

        <div className="cursor-card p-12 text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center rounded-full">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-heading font-normal text-foreground lowercase">No statement data found</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            LedgerLens runs completely in your browser memory. We need at least one parsed PDF statement to populate your metrics, ledgers, and cash flow insights.
          </p>
          <div className="pt-2">
            <Link to="/enhanced/documents" className="cursor-btn-primary inline-flex items-center gap-2">
              Upload first statement <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 font-sans">

      {/* Quick Actions & Overview Info Row — flat and correctly aligned */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-1">
        <div className="space-y-1">
          {/* <p className="text-sm text-muted-foreground font-light">
            A precise visual audit of closing statement balances, monthly net cash positions, and normalized payees.
          </p> */}
          {/* {statsStrip && (
            <p className="text-[11px] text-muted-foreground font-mono">
              {statsStrip}
            </p>
          )} */}
        </div>

        {/* Quick Actions Row */}
        {/* <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/enhanced/documents"
            className="inline-flex items-center gap-1.5 border border-border bg-card hover:bg-sub-card/80 px-3.5 py-2 text-xs font-semibold text-foreground rounded-md shadow-sm transition-colors"
          >
            <UploadCloud className="h-3.5 w-3.5 text-primary" />
            <span>Upload statement</span>
          </Link>

          <Link
            to="/enhanced/alerts"
            className="inline-flex items-center gap-1.5 border border-border bg-card hover:bg-sub-card/80 px-3.5 py-2 text-xs font-semibold text-foreground rounded-md shadow-sm transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-primary" />
            <span>Review alerts</span>
            {alertsCount > 0 && (
              <span className="ml-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {alertsCount}
              </span>
            )}
          </Link>

          <button
            onClick={handleExportLatest}
            className="inline-flex items-center gap-1.5 border border-border bg-card hover:bg-sub-card/80 px-3.5 py-2 text-xs font-semibold text-foreground rounded-md shadow-sm transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Export this period</span>
          </button>
        </div> */}
      </section>

      {/* Action Needed Banner */}
      {/* <section className="cursor-card overflow-hidden">
        <div className="border-l-4 border-primary bg-primary/5 px-6 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1.5 flex-grow">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Action Items</h4>
              {bannerItems.length > 0 ? (
                <ul className="space-y-2">
                  {bannerItems.map((item, idx) => (
                    <li key={idx} className="text-xs text-card-foreground font-light">
                      <Link to={item.link} className="hover:text-primary transition-colors flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <span>{item.text}</span>
                        <ArrowRight className="h-3 w-3 opacity-70" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-2 text-xs text-success font-light">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>All caught up! Your statement records and categories are up to date.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section> */}

      {/* Stat Cards Grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Closing Balance"
          value={data?.metrics.latestBalance === null || data?.metrics.latestBalance === undefined ? "-" : formatMoney(data.metrics.latestBalance)}
          icon={<Wallet className="h-4 w-4" />}
          badge="Latest statement balance"
          delta={deltas?.balance}
        />
        <StatCard
          title="Credits"
          value={data ? formatMoney(data.metrics.totalIncome) : "-"}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="success"
          badge="Total incoming movements"
          delta={deltas?.income}
        />
        <StatCard
          title="Debits"
          value={data ? formatMoney(data.metrics.totalExpenses) : "-"}
          icon={<TrendingDown className="h-4 w-4" />}
          tone="danger"
          badge="Total outgoing items"
          delta={deltas?.expenses}
        />
        <StatCard
          title="Net Position"
          value={data ? formatMoney(data.metrics.netBalance) : "-"}
          icon={<Wallet className="h-4 w-4" />}
          tone={data && data.metrics.netBalance >= 0 ? "success" : "danger"}
          badge={data && data.metrics.netBalance >= 0 ? "Positive cash flow" : "Negative cash flow"}
          delta={deltas?.net}
        />
      </section>

      {/* Recently Uploaded Documents Section */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-heading text-lg font-normal text-foreground">Recently uploaded documents</h2>
            {/* <p className="text-xs text-muted-foreground font-light">Latest statements added to your workspace.</p> */}
          </div>
          <Link
            to="/enhanced/documents"
            className="cursor-text-link inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary"
          >
            View all documents →
          </Link>
        </div>

        <article className="cursor-card p-6">
          {recentUploadedDocs.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground font-light">No documents uploaded yet</p>
              <div>
                <Link to="/enhanced/documents" className="cursor-btn-primary inline-flex items-center gap-2 text-xs">
                  Upload statement <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentUploadedDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate("/enhanced/documents")}
                  className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between hover:bg-sub-card/30 px-3 -mx-3 rounded-lg cursor-pointer transition-all duration-150"
                >
                  {/* File name & Icon */}
                  <div className="flex items-center gap-3.5 min-w-0 sm:w-1/3">
                    <div className="flex h-9 w-9 items-center justify-center border border-border bg-sub-card rounded text-muted-foreground flex-shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground text-sm">{doc.fileName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground font-light">
                        {formatUploadDate(doc.uploadedAt)} · {getRelativeTime(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Statement Period & Extraction Count */}
                  <div className="flex items-center justify-between sm:justify-start gap-8 text-xs text-card-foreground sm:w-1/3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Statement Period</p>
                      <p className="mt-0.5 font-medium">{formatStatementPeriod(doc.statementStartDate, doc.statementEndDate)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Transactions</p>
                      <p className="mt-0.5 font-semibold font-mono">{doc.transactionCount} items</p>
                    </div>
                  </div>

                  {/* Size, Status & Action Link */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 sm:w-1/3">
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatFileSize(doc.fileSize)}
                    </span>
                    {getStatusBadge(doc.extractionStatus)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void downloadDocumentSpreadsheet(doc.id, doc.fileName);
                      }}
                      className="flex h-8 w-8 items-center justify-center border border-border bg-card hover:bg-sub-card hover:text-primary rounded text-muted-foreground transition-all duration-150"
                      title="Download formatted spreadsheet"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {/* Account Balances Row */}
      {accountBalances.length > 1 && (
        <section className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Balances by Statement Source</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accountBalances.map(acc => (
              <div key={acc.id} className="cursor-card p-4 flex items-center justify-between hover:border-sub-border hover:bg-sub-card/30 transition-all duration-150">
                <div className="min-w-0 pr-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate">{acc.name}</p>
                  <p className="mt-1 text-lg font-heading font-normal text-foreground truncate font-mono">{formatMoney(acc.balance)}</p>
                </div>
                <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-sans uppercase font-bold flex-shrink-0">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Side by side CSS Grid (Payee Ledger and Recent Activity) */}
      <section className="grid gap-6 md:grid-cols-2 items-stretch">

        {/* Payee Ledger */}
        <article className="cursor-card p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex flex-col gap-1 border-b border-border pb-4">
              <h2 className="font-heading text-lg font-normal text-foreground">Payee ledger</h2>
              <p className="text-xs text-muted-foreground font-light">Credits, debits, and net totals by merchant payee.</p>
            </div>

            {ledgerRows.length === 0 ? (
              <p className="border border-sub-border bg-sub-card px-5 py-10 text-center text-xs text-muted-foreground font-light rounded-md shadow-sm mt-5">
                No payee ledger metrics available yet.
              </p>
            ) : (
              <>
                {/* Mobile list view */}
                <div className="mt-5 space-y-3 lg:hidden">
                  {ledgerRows.map((entry) => (
                    <div key={entry.payee} className="border border-sub-border bg-sub-card/60 p-4 rounded-md shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground text-sm">{entry.payee}</p>
                          <p className="mt-1 text-xs text-muted-foreground font-light">{entry.transactions} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Net</p>
                          <p className={`mt-0.5 font-mono text-xs font-semibold tabular-nums ${entry.net >= 0 ? "text-success" : "text-destructive"}`}>
                            {formatMoney(entry.net)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-card p-2 border border-border rounded">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Debit</p>
                          <p className="font-mono text-[11px] text-destructive font-semibold mt-0.5">{entry.debit > 0 ? formatMoney(entry.debit) : "-"}</p>
                        </div>
                        <div className="bg-card p-2 border border-border rounded">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Credit</p>
                          <p className="font-mono text-[11px] text-success font-semibold mt-0.5">{entry.credit > 0 ? formatMoney(entry.credit) : "-"}</p>
                        </div>
                        <div className="bg-card p-2 border border-border rounded">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Total</p>
                          <p className="font-mono text-[11px] text-foreground font-semibold mt-0.5">{formatMoney(entry.total)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table view */}
                <div className="mt-5 hidden overflow-x-auto border border-border rounded-md lg:block">
                  <table className="w-full min-w-[350px] text-sm">
                    <thead className="bg-sub-card text-muted-foreground text-[10px] font-bold uppercase tracking-wider border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left">Payee</th>
                        <th className="px-4 py-3 text-right">Debit</th>
                        <th className="px-4 py-3 text-right">Credit</th>
                        <th className="px-4 py-3 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {ledgerRows.slice(0, 5).map((entry) => (
                        <tr key={entry.payee} className="align-middle hover:bg-sub-card/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="min-w-0">
                              <p className="max-w-[130px] truncate font-semibold text-foreground text-xs">{entry.payee}</p>
                              <p className="text-[10px] text-muted-foreground font-light">{entry.transactions} txs</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-destructive font-semibold tabular-nums whitespace-nowrap">
                            {entry.debit > 0 ? formatMoney(entry.debit) : "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-success font-semibold tabular-nums whitespace-nowrap">
                            {entry.credit > 0 ? formatMoney(entry.credit) : "-"}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono text-xs font-semibold tabular-nums whitespace-nowrap ${entry.net >= 0 ? "text-success" : "text-destructive"}`}>
                            {formatMoney(entry.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="pt-6 text-center border-t border-border mt-6">
            <Link
              to="/enhanced/transactions"
              className="cursor-text-link inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
            >
              View transactions ledger <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>

        {/* Recent Activity */}
        <article className="cursor-card p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex flex-col gap-1 border-b border-border pb-4">
              <h2 className="font-heading text-lg font-normal text-foreground">Recent activity</h2>
              <p className="text-xs text-muted-foreground font-light">Latest extracted transactional log rows.</p>
            </div>

            <div className="mt-5 space-y-2.5">
              {sortedRecent.length === 0 ? (
                <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">No recent activity logged.</p>
              ) : (
                sortedRecent.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 border border-border bg-card px-4 py-3.5 hover:border-sub-border hover:bg-sub-card/50 transition-all duration-150 rounded-md shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground text-sm">{transaction.payee}</p>
                      <p className="mt-1 text-xs text-muted-foreground font-light">
                        {getRelativeTime(transaction.transactionDate)} • {transaction.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-xs font-semibold tabular-nums ${transaction.direction === "credit" ? "text-success" : "text-destructive"}`}>
                        {transaction.direction === "credit" ? "+" : "-"}{formatMoney(transaction.amount)}
                      </p>
                      <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{transaction.direction}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-6 text-center border-t border-border mt-6">
            <Link
              to="/enhanced/transactions"
              className="cursor-text-link inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
            >
              View all transactions <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>

      </section>
    </div>
  );
}
