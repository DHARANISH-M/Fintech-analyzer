import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  ChevronDown,
  CircleDollarSign,
  Filter,
  PiggyBank,
  PieChart as PieChartIcon,
  Sparkles,
  Table2,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Download,
  Info,
  Calendar,
  Layers,
  User,
  FileText,
  DollarSign
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnalyticsResponse, CategoryBreakdown, DashboardMetric, MonthlyPoint, TransactionRecord } from "@shared/api";
import { fetchAnalytics, fetchTransactions, formatMoney, getCurrencySymbol } from "@/lib/finance-api";
import Loader from "@/components/Loader";
import {
  buildMetricsFromTransactions,
  buildMonthlySeriesFromTransactions,
  buildCategoryBreakdownFromTransactions,
  buildRecurringTransactionsFromTransactions,
  buildPayeeBreakdownFromTransactions,
  buildDocumentComparisonFromTransactions,
  healthScore,
  predictedNextExpense,
  convertCurrency,
} from "@/lib/analytics-helpers";

const COLORS = [
  "#f54e00", // Cursor Orange
  "#c0a8dd", // Lavender
  "#9fbbe0", // Read Blue
  "#9fc9a2", // Grep Mint
  "#c08532", // Done Gold
  "#dfa88f", // Thinking Peach
];

type CategoryView = "pie" | "table";
type CategorySort = "amount" | "percentage" | "trend";
type CategoryRow = CategoryBreakdown & { trend: number };
type ChartType = "area" | "bar";

// Custom MultiSelect Dropdown Component
function MultiSelectDropdown({
  label,
  icon,
  options,
  selected,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((x) => x !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-card border border-border px-3.5 py-2.5 text-left text-xs font-semibold text-foreground rounded-md flex justify-between items-center hover:bg-sub-card/50 transition-colors duration-150"
      >
        <span className="flex items-center gap-2 truncate">
          {icon}
          {selected.length === 0 ? `All ${label}s` : `${selected.length} ${label}s`}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-full max-h-60 overflow-y-auto bg-card border border-border rounded-md shadow-lg z-20 p-2 space-y-1">
            {options.length === 0 ? (
              <div className="p-2 text-center text-xs text-muted-foreground font-light">
                No options available
              </div>
            ) : (
              options.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-sub-card text-xs text-foreground cursor-pointer rounded-sm transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => toggleOption(opt)}
                    className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span className="truncate">{opt}</span>
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [rawTransactions, setRawTransactions] = useState<TransactionRecord[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  const [transactionsError, setTransactionsError] = useState("");

  // Base currency options
  const [targetCurrency, setTargetCurrency] = useState(getCurrencySymbol() || "INR");

  // Filters state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPayees, setSelectedPayees] = useState<string[]>([]);
  const [selectedSourceFiles, setSelectedSourceFiles] = useState<string[]>([]);
  const [amountMin, setAmountMin] = useState<number | string>("");
  const [amountMax, setAmountMax] = useState<number | string>("");

  // Display toggles
  const [categoryView, setCategoryView] = useState<CategoryView>("pie");
  const [categorySort, setCategorySort] = useState<CategorySort>("amount");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [isHealthExpanded, setIsHealthExpanded] = useState(false);

  // Load filters from URL query parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("startDate")) setStartDate(params.get("startDate")!);
    if (params.get("endDate")) setEndDate(params.get("endDate")!);
    if (params.get("searchQuery")) setSearchQuery(params.get("searchQuery")!);
    if (params.get("amountMin")) setAmountMin(params.get("amountMin")!);
    if (params.get("amountMax")) setAmountMax(params.get("amountMax")!);
    
    const cats = params.get("categories");
    if (cats) setSelectedCategories(cats.split(",").filter(Boolean));
    
    const payees = params.get("payees");
    if (payees) setSelectedPayees(payees.split(",").filter(Boolean));
    
    const files = params.get("sourceFiles");
    if (files) setSelectedSourceFiles(files.split(",").filter(Boolean));
    
    if (params.get("targetCurrency")) setTargetCurrency(params.get("targetCurrency")!);
  }, []);

  // Update URL parameters when filters or targetCurrency change
  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (searchQuery) params.set("searchQuery", searchQuery);
    if (amountMin !== "") params.set("amountMin", String(amountMin));
    if (amountMax !== "") params.set("amountMax", String(amountMax));
    if (selectedCategories.length > 0) params.set("categories", selectedCategories.join(","));
    if (selectedPayees.length > 0) params.set("payees", selectedPayees.join(","));
    if (selectedSourceFiles.length > 0) params.set("sourceFiles", selectedSourceFiles.join(","));
    if (targetCurrency) params.set("targetCurrency", targetCurrency);

    const newSearch = params.toString();
    const currentSearch = window.location.search.replace(/^\?/, "");
    if (newSearch !== currentSearch) {
      const newUrl = `${window.location.pathname}${newSearch ? "?" + newSearch : ""}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [
    startDate,
    endDate,
    searchQuery,
    selectedCategories,
    selectedPayees,
    selectedSourceFiles,
    amountMin,
    amountMax,
    targetCurrency
  ]);

  // Parallel loading of Analytics and Transactions
  useEffect(() => {
    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const res = await fetchAnalytics();
        setData(res);
        setAnalyticsError("");
      } catch (err) {
        setAnalyticsError(err instanceof Error ? err.message : "Failed to load base analytics.");
      } finally {
        setAnalyticsLoading(false);
      }
    };

    const loadTransactions = async () => {
      setTransactionsLoading(true);
      try {
        const res = await fetchTransactions();
        setRawTransactions(res.transactions);
        setTransactionsError("");
      } catch (err) {
        setTransactionsError(err instanceof Error ? err.message : "Failed to load raw transactions.");
      } finally {
        setTransactionsLoading(false);
      }
    };

    void loadAnalytics();
    void loadTransactions();
  }, []);

  // Unique options for filter select menus
  const categoriesList = useMemo(() => {
    return Array.from(new Set(rawTransactions.map((t) => t.category).filter(Boolean))).sort();
  }, [rawTransactions]);

  const payeesList = useMemo(() => {
    return Array.from(new Set(rawTransactions.map((t) => t.payee).filter(Boolean))).sort();
  }, [rawTransactions]);

  const sourceFilesList = useMemo(() => {
    return Array.from(new Set(rawTransactions.map((t) => t.sourceFile).filter(Boolean))).sort();
  }, [rawTransactions]);

  // Performance boundary check comment:
  // If rawTransactions exceeds ~10k items, client-side recomputation in the main thread 
  // can block UI responsiveness. Moving filtering/aggregating logic to a Web Worker 
  // or paginating raw transaction payloads is recommended at that scale.
  const hasHighTransactionVolume = rawTransactions.length > 10000;

  // Filtered subset of transactions
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((tx) => {
      // Date filter range
      if (startDate && tx.transactionDate < startDate) return false;
      if (endDate && tx.transactionDate > endDate) return false;

      // Free text search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const descMatch = tx.description?.toLowerCase().includes(q);
        const payeeMatch = tx.payee?.toLowerCase().includes(q);
        const categoryMatch = tx.category?.toLowerCase().includes(q);
        const refMatch = tx.reference?.toLowerCase().includes(q);
        if (!descMatch && !payeeMatch && !categoryMatch && !refMatch) return false;
      }

      // Dropdown filters
      if (selectedCategories.length > 0 && !selectedCategories.includes(tx.category)) return false;
      if (selectedPayees.length > 0 && !selectedPayees.includes(tx.payee)) return false;
      if (selectedSourceFiles.length > 0 && !selectedSourceFiles.includes(tx.sourceFile)) return false;

      // Amount filter check (converted to target currency)
      const convertedAmount = convertCurrency(Number(tx.amount), tx.currencyCode, targetCurrency);
      if (amountMin !== "" && convertedAmount < Number(amountMin)) return false;
      if (amountMax !== "" && convertedAmount > Number(amountMax)) return false;

      return true;
    });
  }, [
    rawTransactions,
    startDate,
    endDate,
    searchQuery,
    selectedCategories,
    selectedPayees,
    selectedSourceFiles,
    amountMin,
    amountMax,
    targetCurrency,
  ]);

  // Recalculate analytics on the filtered transaction list
  const filteredAnalytics = useMemo(() => {
    if (rawTransactions.length === 0) return null;

    const metrics = buildMetricsFromTransactions(filteredTransactions, targetCurrency);
    const monthlySeries = buildMonthlySeriesFromTransactions(filteredTransactions, targetCurrency);
    const expenseCategories = buildCategoryBreakdownFromTransactions(filteredTransactions, "debit", targetCurrency);
    const incomeCategories = buildCategoryBreakdownFromTransactions(filteredTransactions, "credit", targetCurrency);
    const recurringTransactions = buildRecurringTransactionsFromTransactions(filteredTransactions, targetCurrency);
    const payeeBreakdown = buildPayeeBreakdownFromTransactions(filteredTransactions, targetCurrency);
    const documentComparison = buildDocumentComparisonFromTransactions(filteredTransactions, targetCurrency);

    return {
      metrics,
      monthlySeries,
      expenseCategories,
      incomeCategories,
      recurringTransactions,
      payeeBreakdown,
      documentComparison,
    };
  }, [filteredTransactions, targetCurrency, rawTransactions.length]);

  // Discrepancy detector between server-computed metrics and local calculations
  const localUnfilteredMetrics = useMemo(() => {
    return buildMetricsFromTransactions(rawTransactions, targetCurrency);
  }, [rawTransactions, targetCurrency]);

  const hasDiscrepancy = useMemo(() => {
    if (!data || !localUnfilteredMetrics || rawTransactions.length === 0) return false;
    const serverIncome = convertCurrency(data.metrics.totalIncome, "INR", targetCurrency);
    const serverExpense = convertCurrency(data.metrics.totalExpenses, "INR", targetCurrency);
    
    const diffIncome = Math.abs(serverIncome - localUnfilteredMetrics.totalIncome);
    const diffExpense = Math.abs(serverExpense - localUnfilteredMetrics.totalExpense);
    // Flag discrepancy if total metrics deviate by more than 1 currency unit
    return diffIncome > 1.0 || diffExpense > 1.0;
  }, [data, localUnfilteredMetrics, rawTransactions.length, targetCurrency]);

  // Prior period metrics mapping for card deltas
  const priorPeriodMetrics = useMemo(() => {
    if (rawTransactions.length === 0) return null;

    let priorStartStr = "";
    let priorEndStr = "";

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      
      const priorStart = new Date(start);
      priorStart.setDate(priorStart.getDate() - diffDays);
      const priorEnd = new Date(start);
      
      priorStartStr = priorStart.toISOString().slice(0, 10);
      priorEndStr = priorEnd.toISOString().slice(0, 10);
    } else {
      // If no date filters are set (all-time), compare the final month of data to the preceding month
      const dates = filteredTransactions.map((t) => t.transactionDate).sort();
      if (dates.length === 0) return null;
      
      const maxDate = new Date(dates[dates.length - 1]);
      const prevMonth = new Date(maxDate);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevPrevMonth = new Date(maxDate);
      prevPrevMonth.setMonth(prevPrevMonth.getMonth() - 2);

      priorStartStr = prevPrevMonth.toISOString().slice(0, 10);
      priorEndStr = prevMonth.toISOString().slice(0, 10);
    }

    const priorTxs = rawTransactions.filter(
      (t) => t.transactionDate >= priorStartStr && t.transactionDate < priorEndStr
    );
    return buildMetricsFromTransactions(priorTxs, targetCurrency);
  }, [startDate, endDate, rawTransactions, filteredTransactions, targetCurrency]);

  // Delta percentage display helper
  const getPeriodDeltaDisplay = (current: number, prior: number | undefined) => {
    if (prior === undefined || prior === null || prior === 0) return "vs prior period N/A";
    const delta = ((current - prior) / prior) * 100;
    const sign = delta >= 0 ? "+" : "";
    return `${sign}${delta.toFixed(0)}% vs prior`;
  };

  // Financial Health calculations
  const healthData = useMemo(() => {
    if (!filteredAnalytics) return null;
    
    const { totalIncome, totalExpense } = filteredAnalytics.metrics;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const recurringBillCount = filteredAnalytics.recurringTransactions.length;
    
    const sortedPayees = [...filteredAnalytics.payeeBreakdown].sort((a, b) => b.totalDebit - a.totalDebit);
    const maxPayeeDebit = sortedPayees[0]?.totalDebit ?? 0;
    const payeeConcentration = totalExpense > 0 ? maxPayeeDebit / totalExpense : 0;

    return healthScore({ savingsRate, recurringBillCount, payeeConcentration });
  }, [filteredAnalytics]);

  const healthGrade = (score: number) => {
    if (score >= 85) return { grade: "A", color: "text-success border-success/30 bg-success/5" };
    if (score >= 70) return { grade: "B", color: "text-primary border-primary/30 bg-primary/5" };
    if (score >= 55) return { grade: "C", color: "text-warning border-warning/30 bg-warning/5" };
    if (score >= 40) return { grade: "D", color: "text-[#c08532] border-[#c08532]/30 bg-[#c08532]/5" };
    return { grade: "F", color: "text-destructive border-destructive/30 bg-destructive/5" };
  };

  // Anomaly detector
  const anomalies = useMemo(() => {
    if (!filteredAnalytics) return [];
    const list: Array<{ type: "price-hike" | "large-spend"; title: string; desc: string; amount: number; date: string }> = [];

    // 1. Detect subscription price jumps in recurring transactions (> 15% increase)
    for (const item of filteredAnalytics.recurringTransactions) {
      if (item.lastAmount > item.averageAmount * 1.15) {
        list.push({
          type: "price-hike",
          title: `Subscription Cost Jump: ${item.description}`,
          desc: `Latest payment of ${formatMoney(item.lastAmount, targetCurrency)} is higher than the historical average of ${formatMoney(item.averageAmount, targetCurrency)}.`,
          amount: item.lastAmount,
          date: item.lastDate,
        });
      }
    }

    // 2. Detect one-off category anomalies (> 3x category average spend)
    const categoryAverages = new Map<string, { sum: number; count: number }>();
    const debits = filteredTransactions.filter((t) => t.direction === "debit");
    
    for (const tx of debits) {
      const converted = convertCurrency(Number(tx.amount), tx.currencyCode, targetCurrency);
      const current = categoryAverages.get(tx.category) ?? { sum: 0, count: 0 };
      categoryAverages.set(tx.category, { sum: current.sum + converted, count: current.count + 1 });
    }

    for (const tx of debits) {
      const converted = convertCurrency(Number(tx.amount), tx.currencyCode, targetCurrency);
      const categoryAvg = categoryAverages.get(tx.category);
      if (categoryAvg && categoryAvg.count > 1) {
        const average = categoryAvg.sum / categoryAvg.count;
        if (converted > average * 3 && converted > 1000) {
          list.push({
            type: "large-spend",
            title: `Outlier Category spend at ${tx.payee || "Merchant"}`,
            desc: `One-off payment of ${formatMoney(converted, targetCurrency)} is 3x larger than the typical ${tx.category} average of ${formatMoney(average, targetCurrency)}.`,
            amount: converted,
            date: tx.transactionDate,
          });
        }
      }
    }

    return list.sort((a, b) => b.amount - a.amount).slice(0, 3);
  }, [filteredAnalytics, filteredTransactions, targetCurrency]);

  // Statistical expense forecast
  const nextMonthForecast = useMemo(() => {
    if (!filteredAnalytics) return null;
    return predictedNextExpense(filteredAnalytics.monthlySeries);
  }, [filteredAnalytics]);

  // Active filters helper list for filter chips row
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onClear: () => void }> = [];
    if (startDate) {
      chips.push({ id: "startDate", label: `From: ${startDate}`, onClear: () => setStartDate("") });
    }
    if (endDate) {
      chips.push({ id: "endDate", label: `To: ${endDate}`, onClear: () => setEndDate("") });
    }
    if (searchQuery) {
      chips.push({ id: "search", label: `Search: "${searchQuery}"`, onClear: () => setSearchQuery("") });
    }
    if (amountMin !== "") {
      chips.push({ id: "amtMin", label: `Min: ${formatMoney(Number(amountMin), targetCurrency)}`, onClear: () => setAmountMin("") });
    }
    if (amountMax !== "") {
      chips.push({ id: "amtMax", label: `Max: ${formatMoney(Number(amountMax), targetCurrency)}`, onClear: () => setAmountMax("") });
    }
    selectedCategories.forEach((cat) => {
      chips.push({
        id: `cat-${cat}`,
        label: `Cat: ${cat}`,
        onClear: () => setSelectedCategories(selectedCategories.filter((c) => c !== cat)),
      });
    });
    selectedPayees.forEach((payee) => {
      chips.push({
        id: `payee-${payee}`,
        label: `Payee: ${payee}`,
        onClear: () => setSelectedPayees(selectedPayees.filter((p) => p !== payee)),
      });
    });
    selectedSourceFiles.forEach((file) => {
      chips.push({
        id: `file-${file}`,
        label: `File: ${file}`,
        onClear: () => setSelectedSourceFiles(selectedSourceFiles.filter((f) => f !== file)),
      });
    });
    return chips;
  }, [startDate, endDate, searchQuery, amountMin, amountMax, selectedCategories, selectedPayees, selectedSourceFiles, targetCurrency]);

  const clearAllFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setAmountMin("");
    setAmountMax("");
    setSelectedCategories([]);
    setSelectedPayees([]);
    setSelectedSourceFiles([]);
  };

  // Date Presets click handler
  const applyDatePreset = (preset: "this-month" | "last-3-months" | "ytd" | "all-time") => {
    const today = new Date();
    if (preset === "this-month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
    } else if (preset === "last-3-months") {
      const start = new Date();
      start.setMonth(today.getMonth() - 3);
      setStartDate(start.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
    } else if (preset === "ytd") {
      setStartDate(`${today.getFullYear()}-01-01`);
      setEndDate(today.toISOString().slice(0, 10));
    } else if (preset === "all-time") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Recharts interactive drilldown click handlers
  const handleTrendClick = (chartState: any) => {
    if (chartState && chartState.activeLabel) {
      const label = chartState.activeLabel; // Format: "Jun 2026"
      const parsed = new Date(`${label} 01`);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, "0");
        const lastDay = new Date(year, parsed.getMonth() + 1, 0).getDate();
        setStartDate(`${year}-${month}-01`);
        setEndDate(`${year}-${month}-${String(lastDay).padStart(2, "0")}`);
      }
    }
  };

  // CSV Export trigger
  const exportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = [
      "ID",
      "Date",
      "Payee",
      "Description",
      "Category",
      "Direction",
      "Amount",
      "Local Amount",
      "Currency Code",
      "Source Statement",
    ];

    const rows = filteredTransactions.map((tx) => {
      const converted = convertCurrency(Number(tx.amount), tx.currencyCode, targetCurrency);
      return [
        tx.id,
        tx.transactionDate,
        `"${(tx.payee ?? "").replace(/"/g, '""')}"`,
        `"${(tx.description ?? "").replace(/"/g, '""')}"`,
        `"${(tx.category ?? "").replace(/"/g, '""')}"`,
        tx.direction,
        tx.amount,
        converted.toFixed(2),
        tx.currencyCode,
        `"${(tx.sourceFile ?? "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ledgerlens_analytics_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (analyticsLoading || transactionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader size="lg" />
        <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground animate-pulse mt-4">
          Recomputing ledger models...
        </div>
      </div>
    );
  }

  if (analyticsError || transactionsError) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <div className="border border-destructive/20 bg-destructive/5 px-5 py-4 text-xs font-bold text-destructive uppercase tracking-wide rounded-md flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p>Data Stream Sync Failed</p>
            <p className="mt-1 font-normal text-muted-foreground normal-case">{analyticsError || transactionsError}</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="cursor-btn-primary flex items-center gap-2 text-xs py-2 px-4 bg-primary text-primary-foreground rounded-md w-full justify-center"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retry Sync
        </button>
      </div>
    );
  }

  const metrics = filteredAnalytics?.metrics ?? { totalIncome: 0, totalExpense: 0, netBalance: 0, transactionCount: 0, latestBalance: null };
  const savingsRate = metrics.totalIncome > 0 ? (metrics.netBalance / metrics.totalIncome) * 100 : 0;
  
  const sortedCategoryRows = [...(filteredAnalytics?.expenseCategories ?? [])].sort((a, b) => {
    if (categorySort === "percentage") return b.percentage - a.percentage;
    if (categorySort === "trend") return Math.abs(b.trend) - Math.abs(a.trend) || b.amount - a.amount;
    return b.amount - a.amount;
  });

  const payeeBreakdown = filteredAnalytics?.payeeBreakdown ?? [];
  const topPayees = payeeBreakdown.slice(0, 8);
  const documentComparison = filteredAnalytics?.documentComparison ?? [];

  return (
    <div className="space-y-6 pb-8 font-sans max-w-[1600px] mx-auto px-4 sm:px-6">
      
      {/* Scaling volume warning */}
      {hasHighTransactionVolume && (
        <div className="bg-warning/5 border border-warning/20 p-4 rounded-md flex items-start gap-3">
          <Info className="h-4 w-4 text-warning mt-0.5" />
          <p className="text-[11px] text-[#c08532] font-light">
            <strong>High Dataset Density warning:</strong> Client-side recomputation is processing {rawTransactions.length} records. Performance slowdowns might occur when expanding ranges.
          </p>
        </div>
      )}

      {/* Discrepancy indicator alert */}
      {hasDiscrepancy && (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-md flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 animate-pulse" />
          <p className="text-[11px] text-primary font-light">
            <strong>Server Discrepancy Alert:</strong> The server-computed baseline analytics and local unfiltered sums differ slightly. The dashboard is prioritizing recomputed client-side metrics for transaction consistency.
          </p>
        </div>
      )}

      {/* Page Header */}
      <section className="cursor-card p-6 md:p-8 bg-card border border-border rounded-lg shadow-sm flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-primary">LedgerLens Analytica</div>
          <h1 className="text-2xl md:text-3xl font-heading font-normal tracking-tight text-foreground lowercase">Analytics dashboard</h1>
          <p className="text-xs text-muted-foreground font-light max-w-xl">
            Realtime client-side recomputation models of expense mix, anomalies, MoM trends, document distributions, and health grade.
          </p>
        </div>
        
        {/* Currency & CSV buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-sub-card border border-border px-3 py-1.5 rounded-md">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Base Currency</span>
            <select
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-foreground focus:ring-0 outline-none cursor-pointer"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <button
            onClick={exportCSV}
            disabled={filteredTransactions.length === 0}
            className="cursor-btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3 bg-card border border-border rounded-md hover:bg-sub-card text-foreground disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Export Filtered CSV
          </button>
        </div>
      </section>

      {/* Interactive Filters Panel */}
      <section className="bg-sub-card border border-sub-border p-6 rounded-lg space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">Interactive Filters</h2>
            <p className="text-xs text-muted-foreground font-light">Compose and filter transactions in real-time. All graphs will auto-recompute.</p>
          </div>
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 self-start"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear All Filters
          </button>
        </div>

        {/* Date presets block */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border">
          <span className="text-[10px] font-bold uppercase text-muted-foreground mr-2">Quick Presets</span>
          {(["this-month", "last-3-months", "ytd", "all-time"] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => applyDatePreset(preset)}
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded bg-card hover:bg-sub-card border border-border/60 transition-colors"
            >
              {preset.replace("-", " ")}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Start Date */}
          <div className="bg-card border border-border px-3.5 py-2 rounded-md">
            <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3 w-3 text-primary" /> Start Date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground outline-none border-none p-0 focus:ring-0"
            />
          </div>

          {/* End Date */}
          <div className="bg-card border border-border px-3.5 py-2 rounded-md">
            <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3 w-3 text-primary" /> End Date
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground outline-none border-none p-0 focus:ring-0"
            />
          </div>

          {/* Amount Min */}
          <div className="bg-card border border-border px-3.5 py-2 rounded-md">
            <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-3 w-3 text-primary" /> Min Amount ({targetCurrency})
            </span>
            <input
              type="number"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.00"
              className="w-full bg-transparent text-xs text-foreground outline-none border-none p-0 focus:ring-0"
            />
          </div>

          {/* Amount Max */}
          <div className="bg-card border border-border px-3.5 py-2 rounded-md">
            <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-3 w-3 text-primary" /> Max Amount ({targetCurrency})
            </span>
            <input
              type="number"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.00"
              className="w-full bg-transparent text-xs text-foreground outline-none border-none p-0 focus:ring-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Free Text Search */}
          <div className="md:col-span-1">
            <input
              type="text"
              placeholder="Search description, payee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary rounded-md"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-1">
            <MultiSelectDropdown
              label="Category"
              icon={<Layers className="h-3.5 w-3.5 text-primary" />}
              options={categoriesList}
              selected={selectedCategories}
              onChange={setSelectedCategories}
            />
          </div>

          {/* Payee Dropdown */}
          <div className="md:col-span-1">
            <MultiSelectDropdown
              label="Payee"
              icon={<User className="h-3.5 w-3.5 text-primary" />}
              options={payeesList}
              selected={selectedPayees}
              onChange={setSelectedPayees}
            />
          </div>

          {/* Source File Dropdown */}
          <div className="md:col-span-1">
            <MultiSelectDropdown
              label="Source File"
              icon={<FileText className="h-3.5 w-3.5 text-primary" />}
              options={sourceFilesList}
              selected={selectedSourceFiles}
              onChange={setSelectedSourceFiles}
            />
          </div>
        </div>

        {/* Filter Chips Bar */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {activeChips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-card border border-border text-foreground rounded-full"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onClear}
                  className="hover:text-primary text-muted-foreground text-xs"
                >
                  &times;
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-[10px] font-bold text-muted-foreground hover:text-primary uppercase ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Income */}
        <article className="cursor-card p-6 bg-card border border-border rounded-lg shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Income</p>
              <p className="mt-3 text-2xl font-heading font-normal text-foreground font-mono">
                {formatMoney(metrics.totalIncome, targetCurrency)}
              </p>
            </div>
            <div className="p-2.5 bg-success/5 border border-success/20 text-success rounded-md">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3.5 text-[10px] font-semibold text-success lowercase">
            {getPeriodDeltaDisplay(metrics.totalIncome, priorPeriodMetrics?.totalIncome)}
          </p>
        </article>

        {/* Total Expense */}
        <article className="cursor-card p-6 bg-card border border-border rounded-lg shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Expense</p>
              <p className="mt-3 text-2xl font-heading font-normal text-foreground font-mono">
                {formatMoney(metrics.totalExpense, targetCurrency)}
              </p>
            </div>
            <div className="p-2.5 bg-destructive/5 border border-destructive/20 text-destructive rounded-md">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3.5 text-[10px] font-semibold text-destructive lowercase">
            {getPeriodDeltaDisplay(metrics.totalExpense, priorPeriodMetrics?.totalExpense)}
          </p>
        </article>

        {/* Net Savings */}
        <article className="cursor-card p-6 bg-card border border-border rounded-lg shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Savings</p>
              <p className={`mt-3 text-2xl font-heading font-normal font-mono ${metrics.netBalance >= 0 ? "text-foreground" : "text-destructive"}`}>
                {formatMoney(metrics.netBalance, targetCurrency)}
              </p>
            </div>
            <div className="p-2.5 bg-primary/5 border border-primary/20 text-primary rounded-md">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <p className={`mt-3.5 text-[10px] font-semibold lowercase ${metrics.netBalance >= 0 ? "text-success" : "text-destructive"}`}>
            {getPeriodDeltaDisplay(metrics.netBalance, priorPeriodMetrics?.netBalance)}
          </p>
        </article>

        {/* Savings Rate */}
        <article className="cursor-card p-6 bg-card border border-border rounded-lg shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Savings Rate</p>
              <p className="mt-3 text-2xl font-heading font-normal text-foreground font-mono">
                {savingsRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-2.5 bg-primary/5 border border-primary/20 text-primary rounded-md">
              <CircleDollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3.5 text-[10px] font-semibold text-primary lowercase">
            {priorPeriodMetrics ? `${(savingsRate - (priorPeriodMetrics.totalIncome > 0 ? ((priorPeriodMetrics.totalIncome - priorPeriodMetrics.totalExpense) / priorPeriodMetrics.totalIncome) * 100 : 0)).toFixed(1)}% shift` : "vs prior period N/A"}
          </p>
        </article>
      </section>

      {/* Main Charts: Monthly Trend & Health Score */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        
        {/* Trend Area Chart */}
        <section className="cursor-card p-6 bg-card border border-border rounded-lg shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-base font-normal text-foreground lowercase">Monthly Trend</h2>
              <p className="text-xs text-muted-foreground font-light">Interactive transaction volume. Click a month to drill down.</p>
            </div>
            
            {/* Chart toggle Area / Stacked Bar */}
            <div className="inline-flex border border-border bg-sub-card p-1 rounded-md">
              <button
                type="button"
                onClick={() => setChartType("area")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all ${chartType === "area" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Area Chart
              </button>
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all ${chartType === "bar" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Stacked Bar
              </button>
            </div>
          </div>

          <div className="h-[320px] w-full" aria-label="Monthly income and expense trend chart">
            {filteredAnalytics?.monthlySeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No trend data in range</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart
                    data={filteredAnalytics?.monthlySeries ?? []}
                    onClick={handleTrendClick}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--muted)" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="var(--muted)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted))", fontSize: 10 }} />
                    <YAxis tickFormatter={(val) => `${Math.round(val / 1000)}k`} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted))", fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => formatMoney(value, targetCurrency)} contentStyle={{ borderRadius: 6, backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} />
                    <Legend iconType="rect" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Area type="monotone" name="Income" dataKey="income" stroke="var(--primary)" fill="url(#incomeFill)" strokeWidth={2} />
                    <Area type="monotone" name="Expense" dataKey="expenses" stroke="var(--muted)" fill="url(#expenseFill)" strokeWidth={2} />
                    <Line type="monotone" name="Net Flow" dataKey="net" stroke="var(--foreground)" strokeWidth={1.5} dot={{ r: 0 }} activeDot={{ r: 4 }} />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={filteredAnalytics?.monthlySeries ?? []}
                    onClick={handleTrendClick}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted))", fontSize: 10 }} />
                    <YAxis tickFormatter={(val) => `${Math.round(val / 1000)}k`} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted))", fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => formatMoney(value, targetCurrency)} contentStyle={{ borderRadius: 6, backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} />
                    <Legend iconType="rect" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar name="Income" dataKey="income" fill="var(--primary)" stackId="stack" radius={[0, 0, 0, 0]} />
                    <Bar name="Expense" dataKey="expenses" fill="var(--muted)" stackId="stack" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {/* Accessible raw table data fallback for charts */}
          <div className="sr-only">
            <h3>Monthly Trend Text Data</h3>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Income</th>
                  <th>Expense</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnalytics?.monthlySeries.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{formatMoney(row.income, targetCurrency)}</td>
                    <td>{formatMoney(row.expenses, targetCurrency)}</td>
                    <td>{formatMoney(row.net, targetCurrency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Financial Health & Prediction Column */}
        <div className="space-y-6">
          
          {/* Health score */}
          <section className="cursor-card p-6 bg-card border border-border rounded-lg shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base font-normal text-foreground lowercase">Health Grade</h2>
                <p className="text-xs text-muted-foreground font-light">Algorithmic metrics balance evaluation.</p>
              </div>
              {healthData && (
                <div className={`h-11 w-11 flex items-center justify-center border rounded-md font-bold text-lg ${healthGrade(healthData.total).color}`}>
                  {healthGrade(healthData.total).grade}
                </div>
              )}
            </div>

            {healthData && (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-heading font-normal font-mono">{healthData.total}</span>
                  <span className="text-xs text-muted-foreground font-light">/100 points</span>
                </div>
                <div className="h-2 bg-sub-border rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${healthData.total >= 70 ? "bg-success" : healthData.total >= 50 ? "bg-[#c08532]" : "bg-destructive"}`}
                    style={{ width: `${healthData.total}%` }}
                  />
                </div>

                {/* Expandable Health breakdown */}
                <div className="border-t border-border pt-3">
                  <button
                    onClick={() => setIsHealthExpanded(!isHealthExpanded)}
                    className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    <span>View Score Contribution breakdown</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isHealthExpanded ? "rotate-180" : ""}`} />
                  </button>
                  
                  {isHealthExpanded && (
                    <div className="mt-3 space-y-2.5 text-xs text-foreground font-light bg-sub-card/40 p-3.5 rounded border border-border/50">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Baseline score</span>
                        <span className="font-mono text-muted-foreground">+{healthData.baseScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Savings rate impact ({savingsRate.toFixed(0)}%)</span>
                        <span className={`font-mono ${healthData.savingsRateContribution >= 0 ? "text-success" : "text-destructive"}`}>
                          {healthData.savingsRateContribution >= 0 ? "+" : ""}{healthData.savingsRateContribution}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recurring bills penalty (-2pt/bill)</span>
                        <span className="font-mono text-destructive">{healthData.recurringBillPenalty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payee concentration penalty</span>
                        <span className="font-mono text-destructive">{healthData.payeeConcentrationPenalty}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Statistical prediction */}
          <section className="cursor-card p-6 bg-card border border-border rounded-lg shadow-sm space-y-3">
            <h2 className="font-heading text-sm font-semibold text-foreground">Forecast expense</h2>
            <p className="text-xs text-muted-foreground font-light">Weighted average next-month debit forecasting model.</p>
            
            {nextMonthForecast && (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-baseline">
                  <p className="text-2xl font-heading font-normal text-foreground font-mono">
                    {formatMoney(nextMonthForecast.prediction, targetCurrency)}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${nextMonthForecast.confidence === "High" ? "bg-success/10 text-success" : nextMonthForecast.confidence === "Medium" ? "bg-warning/10 text-[#c08532]" : "bg-destructive/10 text-destructive"}`}>
                    {nextMonthForecast.confidence} confidence
                  </span>
                </div>
                <div className="text-[11px] leading-relaxed text-muted-foreground font-light">
                  Calculated using decay ratios prioritizing recent months. Variance spread is calculated at <span className="font-mono">{Math.sqrt(nextMonthForecast.variance).toFixed(0)}</span> units.
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Category Breakdown & Anomaly Panels */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        
        {/* Category breakdown */}
        <section className="cursor-card p-6 bg-card border border-border rounded-lg shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-base font-normal text-foreground lowercase">Category Breakdown</h2>
              <p className="text-xs text-muted-foreground font-light">Expense distributions. Click a row/slice to filter by category.</p>
            </div>
            
            {/* View toggle */}
            <div className="inline-flex border border-border bg-sub-card p-1 rounded-md">
              <button
                type="button"
                onClick={() => setCategoryView("pie")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all ${categoryView === "pie" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Pie Chart
              </button>
              <button
                type="button"
                onClick={() => setCategoryView("table")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all ${categoryView === "table" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Table View
              </button>
            </div>
          </div>

          {sortedCategoryRows.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">No category data in range</div>
          ) : (
            <div className="border border-sub-border bg-sub-card/30 p-4 rounded-md">
              {categoryView === "pie" ? (
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] items-center">
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sortedCategoryRows}
                          dataKey="amount"
                          nameKey="category"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                          onClick={(slice) => {
                            if (slice && slice.category) {
                              setSelectedCategories([slice.category]);
                            }
                          }}
                        >
                          {sortedCategoryRows.map((entry, idx) => (
                            <Cell key={entry.category} fill={COLORS[idx % COLORS.length]} className="cursor-pointer" />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatMoney(value, targetCurrency)} contentStyle={{ borderRadius: 6, backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {sortedCategoryRows.map((item, idx) => (
                      <div
                        key={item.category}
                        onClick={() => setSelectedCategories([item.category])}
                        className="flex items-center justify-between p-2 rounded hover:bg-sub-card border border-transparent hover:border-border/30 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-xs font-semibold text-foreground truncate lowercase">{item.category}</span>
                        </div>
                        <div className="text-right flex-shrink-0 pl-2">
                          <span className="text-xs font-mono font-bold text-foreground block">{formatMoney(item.amount, targetCurrency)}</span>
                          <span className="text-[10px] text-muted-foreground font-light">{item.percentage.toFixed(0)}% share</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Technical Sort Filter</span>
                    <select
                      value={categorySort}
                      onChange={(e) => setCategorySort(e.target.value as CategorySort)}
                      className="bg-card border border-border text-xs px-2.5 py-1 rounded"
                    >
                      <option value="amount">Sort by spend</option>
                      <option value="percentage">Sort by ratio</option>
                      <option value="trend">Sort by trend spike</option>
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[500px]">
                      <thead className="bg-sub-card text-muted-foreground text-[10px] uppercase font-bold tracking-wider border-b border-border">
                        <tr>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2 text-right">Debit Total</th>
                          <th className="px-3 py-2 text-right">Percentage</th>
                          <th className="px-3 py-2 text-right">MoM Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {sortedCategoryRows.map((item, idx) => (
                          <tr
                            key={item.category}
                            onClick={() => setSelectedCategories([item.category])}
                            className="hover:bg-sub-card/40 cursor-pointer align-middle transition"
                          >
                            <td className="px-3 py-2.5 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span className="font-semibold text-foreground lowercase">{item.category}</span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-semibold">{formatMoney(item.amount, targetCurrency)}</td>
                            <td className="px-3 py-2.5 text-right text-muted-foreground">{item.percentage.toFixed(1)}%</td>
                            <td className="px-3 py-2.5 text-right">
                              <span className={`inline-flex items-center gap-1 font-semibold ${item.trend > 0 ? "text-destructive" : item.trend < 0 ? "text-success" : "text-muted-foreground"}`}>
                                {item.trend > 0 ? <TrendingUp className="h-3 w-3" /> : item.trend < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                                {Math.abs(item.trend).toFixed(0)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Anomaly Detection panel */}
        <section className="cursor-card p-6 bg-card border border-border rounded-lg shadow-sm space-y-4">
          <div>
            <h2 className="font-heading text-base font-normal text-foreground lowercase">Anomaly Detection</h2>
            <p className="text-xs text-muted-foreground font-light">Flags unusual subscriptions price-hikes or category outliers.</p>
          </div>

          <div className="space-y-3.5">
            {anomalies.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md font-light">
                No high anomalies flagged in current scope.
              </div>
            ) : (
              anomalies.map((item, idx) => (
                <div
                  key={`${item.title}-${idx}`}
                  className="bg-warning/5 border border-warning/20 p-4 rounded-md space-y-2 hover:bg-warning/[0.07] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[#c08532] flex-shrink-0" />
                      <h4 className="text-xs font-bold text-[#c08532]">{item.title}</h4>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      {item.date}
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-light leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-foreground">
                      Amount: {formatMoney(item.amount, targetCurrency)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Payee Concentration & Document Comparison details */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        
        {/* Payee concentration */}
        <section className="cursor-card p-6 bg-card border border-border rounded-lg shadow-sm space-y-4">
          <div>
            <h2 className="font-heading text-base font-normal text-foreground lowercase">Payee Concentration</h2>
            <p className="text-xs text-muted-foreground font-light">Identifies top merchants capturing largest capital outflows.</p>
          </div>

          {topPayees.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">No payee details in range</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr] items-center">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPayees} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="payee" width={100} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted))", fontSize: 9 }} />
                    <Tooltip formatter={(value: number) => formatMoney(value, targetCurrency)} contentStyle={{ borderRadius: 6, backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                    <Bar dataKey="totalDebit" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                      {topPayees.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {topPayees.slice(0, 5).map((payee) => (
                  <div
                    key={payee.payee}
                    onClick={() => setSelectedPayees([payee.payee])}
                    className="p-3 bg-sub-card/50 border border-border/50 rounded-md hover:bg-sub-card cursor-pointer transition"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[130px]">{payee.payee}</p>
                      <span className="text-xs font-mono font-bold text-foreground">
                        {formatMoney(payee.totalDebit, targetCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1.5 text-[10px] text-muted-foreground font-light">
                      <span>{payee.transactionCount} transactions</span>
                      <span>{((payee.totalDebit / metrics.totalExpense) * 100).toFixed(0)}% of expenses</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Document Comparisons */}
        <section className="cursor-card p-6 bg-card border border-border rounded-lg shadow-sm space-y-4">
          <div>
            <h2 className="font-heading text-base font-normal text-foreground lowercase">Document Comparison</h2>
            <p className="text-xs text-muted-foreground font-light">Tracks cash movements mapping across statement source files.</p>
          </div>

          {documentComparison.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">No document compare data</div>
          ) : (
            <div className="space-y-4">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={documentComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="fileName" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted))", fontSize: 9 }} />
                    <YAxis tickFormatter={(val) => `${Math.round(val / 1000)}k`} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted))", fontSize: 9 }} />
                    <Tooltip formatter={(value: number) => formatMoney(value, targetCurrency)} contentStyle={{ borderRadius: 6, backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                    <Legend iconType="rect" wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" name="Income" dataKey="income" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" name="Expense" dataKey="expenses" stroke="var(--muted)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {documentComparison.map((doc) => (
                  <div
                    key={doc.fileName}
                    className="flex items-center justify-between p-3 bg-sub-card/40 border border-border/50 rounded-md text-xs"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-semibold text-foreground truncate max-w-[170px]">{doc.fileName}</p>
                      <p className="text-[10px] text-muted-foreground font-light mt-0.5">
                        {doc.transactionCount} txs • {doc.dateRange}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <button
                        onClick={() => setSelectedSourceFiles([doc.fileName])}
                        className="text-[10px] text-primary font-bold hover:underline uppercase mb-1"
                      >
                        view only
                      </button>
                      <span className="font-mono text-[10px] font-semibold text-foreground">
                        Inc: {formatMoney(doc.income, targetCurrency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
