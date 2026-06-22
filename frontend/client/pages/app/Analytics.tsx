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
import { fetchAnalytics, fetchTransactions, formatMoney } from "@/lib/finance-api";

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

function ToggleSwitch({
  value,
  onChange,
}: {
  value: CategoryView;
  onChange: (value: CategoryView) => void;
}) {
  const options: Array<{ value: CategoryView; label: string; icon: React.ReactNode }> = [
    { value: "pie", label: "Pie Chart", icon: <PieChartIcon className="w-4 h-4" /> },
    { value: "table", label: "Table View", icon: <Table2 className="w-4 h-4" /> },
  ];

  return (
    <div className="inline-flex border border-border bg-sub-card p-1 rounded-md">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-colors duration-150 rounded-sm ${
              active ? "bg-card text-primary border border-border/40 shadow-none" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function CategoryChart({ categories }: { categories: CategoryRow[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              dataKey="amount"
              nameKey="category"
              innerRadius={72}
              outerRadius={110}
              paddingAngle={3}
              label={({ percentage }) => `${Number(percentage).toFixed(0)}%`}
              labelLine={false}
            >
              {categories.map((entry, index) => (
                <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, payload) => {
                const item = payload?.payload as CategoryRow | undefined;
                return [formatMoney(Number(value)), `${item?.category ?? "Category"} • ${item?.percentage.toFixed(1) ?? "0.0"}%`];
              }}
              contentStyle={{ borderRadius: 8, backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:gap-3 lg:overflow-visible">
        {categories.map((item, index) => (
          <div key={item.category} className="min-w-[220px] border border-sub-border bg-sub-card px-4 py-3 text-sm lg:min-w-0 rounded-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <div>
                  <p className="font-semibold text-foreground text-xs">{item.category}</p>
                  <p className="text-[11px] text-muted-foreground font-light">{item.percentage.toFixed(1)}% of mix</p>
                </div>
              </div>
              <span className="font-semibold text-foreground font-mono text-xs">{formatMoney(item.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryTable({
  categories,
  sortBy,
  onSortChange,
}: {
  categories: CategoryRow[];
  sortBy: CategorySort;
  onSortChange: (value: CategorySort) => void;
}) {
  const topCategory = categories[0]?.category;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground font-light">Technical view with sortable spending columns.</div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as CategorySort)}
            className="appearance-none border border-border bg-background py-1.5 pl-3 pr-9 text-xs font-semibold text-foreground outline-none hover:bg-sub-card rounded-md"
          >
            <option value="amount">Sort by amount</option>
            <option value="percentage">Sort by percentage</option>
            <option value="trend">Sort by trend</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
      <div className="overflow-x-auto border border-border rounded-md">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-sub-card border-b border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2.5 text-left">Category</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
              <th className="px-4 py-2.5 text-right">Percentage</th>
              <th className="px-4 py-2.5 text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {categories.map((item, index) => (
              <tr key={item.category} className="hover:bg-sub-card/30 align-middle">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-xs lowercase">{item.category}</span>
                      {item.category === topCategory ? (
                        <span className="bg-sub-card border border-border px-2 py-0.5 text-[9px] lowercase text-primary font-bold rounded-sm">
                          top spending
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-foreground font-semibold">{formatMoney(item.amount)}</td>
                <td className="px-4 py-3 text-right font-light text-muted-foreground tabular-nums text-xs">{item.percentage.toFixed(1)}%</td>
                <td className={`px-4 py-3 text-right font-semibold tabular-nums text-xs ${item.trend > 0 ? "text-destructive" : item.trend < 0 ? "text-success" : "text-muted-foreground"}`}>
                  {item.trend > 0 ? "↑" : item.trend < 0 ? "↓" : "-"} {Math.abs(item.trend).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  action,
  className = "",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`cursor-card p-6 ${className}`}>
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-normal text-foreground lowercase">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground font-light">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "green" | "red" | "blue";
}) {
  const iconStyle = {
    green: "bg-success/10 border-success/20 text-success",
    red: "bg-destructive/10 border-destructive/20 text-destructive",
    blue: "bg-primary/10 border-primary/20 text-primary",
  }[tone];

  const valueColor = {
    green: "text-foreground",
    red: "text-foreground",
    blue: "text-primary",
  }[tone];

  return (
    <article className="cursor-card p-6 transition-all duration-150 hover:border-sub-border hover:bg-sub-card/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className={`mt-3 text-3xl font-heading font-normal tracking-tight ${valueColor}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center border rounded-md flex-shrink-0 ${iconStyle}`}>{icon}</div>
      </div>
      <p className="mt-4 text-[10px] text-muted-foreground font-light lowercase">{subtitle}</p>
    </article>
  );
}

function InsightCard({
  title,
  text,
  tone = "neutral",
  icon,
}: {
  title: string;
  text: string;
  tone?: "neutral" | "warning" | "success";
  icon: React.ReactNode;
}) {
  const styles = {
    neutral: "border-border bg-sub-card/50 text-foreground",
    warning: "border-[#dfa88f]/30 bg-[#dfa88f]/5 text-[#c08532]",
    success: "border-[#9fbbe0]/30 bg-[#9fbbe0]/5 text-primary",
  }[tone];

  return (
    <div className={`border p-4 transition-colors duration-150 rounded-md ${styles}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 opacity-80">{icon}</div>
        <div>
          <p className="font-bold text-xs uppercase tracking-wider">{title}</p>
          <p className="mt-1 text-xs leading-relaxed opacity-95 font-light">{text}</p>
        </div>
      </div>
    </div>
  );
}

function HealthScore({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const label = clamped >= 75 ? "GOOD" : clamped >= 50 ? "AVERAGE" : "POOR";
  const tone = clamped >= 75 ? "bg-success" : clamped >= 50 ? "bg-muted" : "bg-destructive";
  const pill = clamped >= 75 
    ? "bg-success/10 text-success border border-success/20" 
    : clamped >= 50 
    ? "bg-muted/15 text-foreground border border-border" 
    : "bg-destructive/10 text-destructive border border-destructive/20";

  return (
    <div className="border border-border bg-sub-card/30 p-6 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Financial health score</p>
          <div className="mt-3 flex items-end gap-1">
            <span className="text-4xl font-heading font-normal text-foreground">{clamped}</span>
            <span className="pb-1 text-xs text-muted-foreground font-light">/100</span>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-md ${pill}`}>{label}</span>
      </div>
      <div className="mt-5 h-2 overflow-hidden bg-sub-border rounded-full">
        <div className={`h-full transition-all duration-300 ${tone}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function buildMonthDate(monthLabel: string) {
  const parsed = new Date(`${monthLabel} 01`);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function monthLabelFromDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function buildMetricsFromTransactions(transactions: TransactionRecord[], baseMetrics: DashboardMetric): DashboardMetric {
  const totalIncome = transactions
    .filter((entry) => entry.direction === "credit")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const totalExpenses = transactions
    .filter((entry) => entry.direction === "debit")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const latestBalance = [...transactions]
    .filter((entry) => entry.balance !== null && entry.balance !== undefined)
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())[0]?.balance ?? null;

  return {
    ...baseMetrics,
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    latestBalance,
    transactionCount: transactions.length,
  };
}

function buildMonthlySeriesFromTransactions(transactions: TransactionRecord[]): MonthlyPoint[] {
  const grouped = new Map<string, MonthlyPoint>();
  const sorted = [...transactions].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

  for (const transaction of sorted) {
    const key = transaction.transactionDate.slice(0, 7);
    const current = grouped.get(key) ?? {
      month: monthLabelFromDate(transaction.transactionDate),
      income: 0,
      expenses: 0,
      net: 0,
      closingBalance: null,
    };

    if (transaction.direction === "credit") {
      current.income += Number(transaction.amount);
    } else {
      current.expenses += Number(transaction.amount);
    }

    current.net = current.income - current.expenses;
    if (transaction.balance !== null && transaction.balance !== undefined) {
      current.closingBalance = Number(transaction.balance);
    }

    grouped.set(key, current);
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);
}

function buildCategoryBreakdownFromTransactions(
  transactions: TransactionRecord[],
  direction: "credit" | "debit",
): CategoryBreakdown[] {
  const relevant = transactions.filter((entry) => entry.direction === direction);
  const total = relevant.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const grouped = new Map<string, number>();
  const monthlyCategoryTotals = new Map<string, Map<string, number>>();

  for (const transaction of relevant) {
    const amount = Number(transaction.amount);
    grouped.set(transaction.category, (grouped.get(transaction.category) ?? 0) + amount);

    const monthKey = transaction.transactionDate.slice(0, 7);
    const monthBucket = monthlyCategoryTotals.get(monthKey) ?? new Map<string, number>();
    monthBucket.set(transaction.category, (monthBucket.get(transaction.category) ?? 0) + amount);
    monthlyCategoryTotals.set(monthKey, monthBucket);
  }

  const monthKeys = Array.from(monthlyCategoryTotals.keys()).sort((left, right) => left.localeCompare(right));
  const latestMonthTotals = monthKeys.length > 0 ? monthlyCategoryTotals.get(monthKeys[monthKeys.length - 1]) ?? new Map<string, number>() : new Map<string, number>();
  const previousMonthTotals = monthKeys.length > 1 ? monthlyCategoryTotals.get(monthKeys[monthKeys.length - 2]) ?? new Map<string, number>() : new Map<string, number>();

  return Array.from(grouped.entries())
    .map(([category, amount]) => {
      const latestAmount = latestMonthTotals.get(category) ?? 0;
      const previousAmount = previousMonthTotals.get(category) ?? 0;
      let trend = 0;

      if (previousAmount > 0) {
        trend = ((latestAmount - previousAmount) / previousAmount) * 100;
      } else if (latestAmount > 0) {
        trend = 100;
      }

      return {
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        direction,
        trend,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

function buildRecurringTransactionsFromTransactions(transactions: TransactionRecord[]) {
  const grouped = new Map<string, { description: string; category: string; amounts: number[]; lastSeenAt: string }>();

  for (const transaction of transactions.filter((entry) => entry.direction === "debit")) {
    const key = `${transaction.description.toLowerCase()}::${transaction.category}`;
    const current = grouped.get(key) ?? {
      description: transaction.description,
      category: transaction.category,
      amounts: [],
      lastSeenAt: transaction.transactionDate,
    };

    current.amounts.push(Number(transaction.amount));
    if (transaction.transactionDate > current.lastSeenAt) {
      current.lastSeenAt = transaction.transactionDate;
    }

    grouped.set(key, current);
  }

  return Array.from(grouped.values())
    .filter((entry) => entry.amounts.length > 1)
    .map((entry) => ({
      description: entry.description,
      category: entry.category,
      occurrences: entry.amounts.length,
      averageAmount: entry.amounts.reduce((sum, value) => sum + value, 0) / Math.max(entry.amounts.length, 1),
      lastSeenAt: entry.lastSeenAt,
    }))
    .sort((a, b) => b.occurrences - a.occurrences || b.averageAmount - a.averageAmount);
}

function buildPayeeBreakdownFromTransactions(transactions: TransactionRecord[]) {
  const grouped = new Map<string, { payee: string; debit: number; credit: number; total: number; net: number; transactions: number; lastPaidAt: string }>();

  for (const transaction of transactions) {
    const payee = transaction.payee;
    const current = grouped.get(payee) ?? {
      payee,
      debit: 0,
      credit: 0,
      total: 0,
      net: 0,
      transactions: 0,
      lastPaidAt: transaction.transactionDate,
    };

    if (transaction.direction === "debit") {
      current.debit += Number(transaction.amount);
      if (transaction.transactionDate > current.lastPaidAt) {
        current.lastPaidAt = transaction.transactionDate;
      }
    } else {
      current.credit += Number(transaction.amount);
    }

    current.total = current.debit + current.credit;
    current.net = current.credit - current.debit;
    current.transactions += 1;
    grouped.set(payee, current);
  }

  return Array.from(grouped.values())
    .map((entry) => ({
      ...entry,
      averageDebit: entry.debit / Math.max(entry.transactions, 1),
    }))
    .sort((a, b) => b.total - a.total || Math.abs(b.net) - Math.abs(a.net));
}

function buildDocumentComparisonFromTransactions(transactions: TransactionRecord[]) {
  const grouped = new Map<string, { fileName: string; income: number; expenses: number; transactionCount: number }>();

  for (const transaction of transactions) {
    const key = transaction.sourceFile || "Unknown source";
    const current = grouped.get(key) ?? {
      fileName: key,
      income: 0,
      expenses: 0,
      transactionCount: 0,
    };

    if (transaction.direction === "credit") {
      current.income += Number(transaction.amount);
    } else {
      current.expenses += Number(transaction.amount);
    }
    current.transactionCount += 1;
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).sort((a, b) => b.transactionCount - a.transactionCount || b.expenses - a.expenses);
}

function composeFilteredAnalytics(base: AnalyticsResponse, transactions: TransactionRecord[]): AnalyticsResponse {
  return {
    metrics: buildMetricsFromTransactions(transactions, base.metrics),
    monthlySeries: buildMonthlySeriesFromTransactions(transactions),
    expenseCategories: buildCategoryBreakdownFromTransactions(transactions, "debit"),
    incomeCategories: buildCategoryBreakdownFromTransactions(transactions, "credit"),
    recurringTransactions: buildRecurringTransactionsFromTransactions(transactions).slice(0, 10),
    payeeBreakdown: buildPayeeBreakdownFromTransactions(transactions),
    documentComparison: buildDocumentComparisonFromTransactions(transactions),
  };
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryView, setCategoryView] = useState<CategoryView>("pie");
  const [categorySort, setCategorySort] = useState<CategorySort>("amount");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [analyticsResponse, transactionsResponse] = await Promise.all([fetchAnalytics(), fetchTransactions()]);
        setData(analyticsResponse);
        setTransactions(transactionsResponse.transactions);
        setFilteredData(null);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const analyticsView = filteredData ?? data;
  const hasDateFilter = Boolean(startDate || endDate);

  const applyFilter = () => {
    if (!data) {
      return;
    }

    if (!startDate && !endDate) {
      setFilteredData(null);
      return;
    }

    setIsApplyingFilter(true);

    const nextTransactions = transactions.filter((transaction) => {
      const afterStart = !startDate || transaction.transactionDate >= startDate;
      const beforeEnd = !endDate || transaction.transactionDate <= endDate;
      return afterStart && beforeEnd;
    });

    setFilteredData(composeFilteredAnalytics(data, nextTransactions));
    setIsApplyingFilter(false);
  };

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilteredData(null);
  };

  const categoryBreakdownRows = useMemo<CategoryRow[]>(() => {
    if (!analyticsView) {
      return [];
    }

    return analyticsView.expenseCategories.map((item) => ({
      ...item,
      trend: Number(item.trend ?? 0),
    }));
  }, [analyticsView]);

  const sortedCategoryRows = useMemo(() => {
    const rows = [...categoryBreakdownRows];
    rows.sort((left, right) => {
      if (categorySort === "percentage") {
        return right.percentage - left.percentage;
      }
      if (categorySort === "trend") {
        return Math.abs(right.trend) - Math.abs(left.trend) || right.amount - left.amount;
      }
      return right.amount - left.amount;
    });
    return rows;
  }, [categoryBreakdownRows, categorySort]);

  const categoryInsights = useMemo(() => {
    const top = sortedCategoryRows[0];
    const trendLeader = [...sortedCategoryRows]
      .filter((item) => item.trend !== 0)
      .sort((left, right) => Math.abs(right.trend) - Math.abs(left.trend))[0];

    return [
      top ? `${top.category} accounts for the highest expense share at ${top.percentage.toFixed(1)}%.` : null,
      trendLeader
        ? `${trendLeader.category} expenses ${trendLeader.trend > 0 ? "increased" : "decreased"} by ${Math.abs(trendLeader.trend).toFixed(1)}% compared to last month.`
        : "Trend data is steady across the current visible category mix.",
    ].filter(Boolean) as string[];
  }, [sortedCategoryRows]);

  const topPayees = useMemo(() => analyticsView?.payeeBreakdown.slice(0, 8) ?? [], [analyticsView]);

  const totalIncome = analyticsView?.metrics.totalIncome ?? 0;
  const totalExpenses = analyticsView?.metrics.totalExpenses ?? 0;
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const predictedNextExpense = useMemo(() => {
    const source = analyticsView?.monthlySeries ?? [];
    if (source.length === 0) {
      return 0;
    }

    const recent = source.slice(-3);
    const weighted = recent.reduce((sum, item, index) => sum + item.expenses * (index + 1), 0);
    const divisor = recent.reduce((sum, _, index) => sum + (index + 1), 0);
    return divisor > 0 ? weighted / divisor : 0;
  }, [analyticsView]);

  const healthScore = useMemo(() => {
    const savingsComponent = Math.max(0, Math.min(40, savingsRate));
    const recurringPenalty = Math.min(20, (analyticsView?.recurringTransactions.length ?? 0) * 1.5);
    const concentrationPenalty = Math.min(20, (topPayees[0]?.total ?? 0) > 0 && totalExpenses > 0 ? (topPayees[0].total / totalExpenses) * 20 : 0);
    const coverageBonus = totalIncome > totalExpenses ? 35 : 15;
    return coverageBonus + savingsComponent - recurringPenalty - concentrationPenalty + 25;
  }, [analyticsView, savingsRate, topPayees, totalExpenses, totalIncome]);

  const anomalyItems = useMemo(() => {
    return [...(analyticsView?.recurringTransactions ?? [])]
      .sort((a, b) => b.averageAmount - a.averageAmount || b.occurrences - a.occurrences)
      .slice(0, 3);
  }, [analyticsView]);

  const insights = useMemo(() => {
    if (!analyticsView) {
      return [] as Array<{ title: string; text: string; tone?: "neutral" | "warning" | "success"; icon: React.ReactNode }>;
    }

    const latest = analyticsView.monthlySeries[analyticsView.monthlySeries.length - 1];
    const previous = analyticsView.monthlySeries[analyticsView.monthlySeries.length - 2];
    const topCategory = analyticsView.expenseCategories[0];
    const topPayee = analyticsView.payeeBreakdown[0];
    const latestChange = latest && previous && previous.expenses > 0
      ? ((latest.expenses - previous.expenses) / previous.expenses) * 100
      : null;

    return [
      topCategory
        ? {
            title: "Expense concentration",
            text: `${topCategory.category} contributes ${topCategory.percentage.toFixed(1)}% of visible expenses.`,
            tone: "warning" as const,
            icon: <Filter className="h-4 w-4" />,
          }
        : null,
      latestChange !== null
        ? {
            title: "Month-over-month trend",
            text: `Expenses ${latestChange >= 0 ? "increased" : "decreased"} by ${Math.abs(latestChange).toFixed(1)}% in ${latest?.month}.`,
            tone: latestChange > 15 ? "warning" as const : "success" as const,
            icon: latestChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
          }
        : null,
      topPayee
        ? {
            title: "Most active payee",
            text: `${topPayee.payee} accounts for ${formatMoney(topPayee.total)} across ${topPayee.transactions} transactions.`,
            tone: "neutral" as const,
            icon: <Sparkles className="h-4 w-4" />,
          }
        : null,
    ].filter(Boolean) as Array<{ title: string; text: string; tone?: "neutral" | "warning" | "success"; icon: React.ReactNode }>;
  }, [analyticsView]);

  if (isLoading) {
    return <div className="text-xs uppercase font-bold tracking-wider text-[#807d72]">Loading analytics insights...</div>;
  }

  if (error) {
    return (
      <div className="border border-[#cf2d56]/25 bg-[#cf2d56]/5 px-6 py-4 text-xs font-bold text-[#cf2d56] uppercase tracking-wide rounded-md">
        {error}
      </div>
    );
  }

  if (!data) {
    return <div className="text-xs uppercase font-bold tracking-wider text-[#807d72]">No analytics data available.</div>;
  }

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* <section className="cursor-card p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">FINANCE INTELLIGENCE</p>
            <h1 className="mt-2 text-3xl font-heading font-normal tracking-tight text-foreground">Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-card-foreground font-light">
              Deep metrics of statement spend distributions, visual trends, recurring transaction profiles, anomalies, and statistical forecasts.
            </p>
          </div>
          <div className="border border-border bg-card px-5 py-3 rounded-md shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Transactions Analyzed</p>
            <p className="mt-1 text-2xl font-heading font-normal text-foreground font-mono">{analyticsView?.metrics.transactionCount ?? 0}</p>
          </div>
        </div>
      </section> */}

      {/* Central Date Filtering */}
      <section className="border border-sub-border bg-sub-card p-6 rounded-lg shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-heading text-base font-normal text-foreground">Date range filter</h2>
            <p className="mt-1 text-xs text-muted-foreground font-light">Apply a date range to filter and refresh analytics cards, charts, and behavior signals.</p>
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Centralized filtering</div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_auto_auto] xl:items-end">
          <label className="bg-card border border-border px-4 py-3 block rounded-md shadow-sm">
            <span className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5 text-primary" /> Start date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </label>

          <label className="bg-card border border-border px-4 py-3 block rounded-md shadow-sm">
            <span className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5 text-primary" /> End date
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </label>

          <button
            type="button"
            onClick={applyFilter}
            disabled={!hasDateFilter || isApplyingFilter}
            className="cursor-btn-primary w-full xl:w-auto h-12 flex items-center justify-center disabled:bg-sub-border disabled:text-muted-foreground disabled:border-sub-border disabled:cursor-not-allowed"
          >
            {isApplyingFilter ? 'APPLYING...' : 'APPLY FILTER'}
          </button>

          <button
            type="button"
            onClick={clearFilter}
            className="cursor-btn-secondary w-full xl:w-auto h-12 flex items-center justify-center bg-card"
          >
            CLEAR FILTER
          </button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground font-light">
          {hasDateFilter
            ? `Showing results for selected date range${startDate ? ` from ${startDate}` : ''}${endDate ? ` to ${endDate}` : ''}.`
            : 'Showing analytics for all transactions.'}
        </p>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Income" value={formatMoney(totalIncome)} subtitle="Incoming cash flow" icon={<ArrowUpRight className="h-4 w-4" />} tone="green" />
        <SummaryCard title="Total Expense" value={formatMoney(totalExpenses)} subtitle="Outgoing cash flow" icon={<ArrowDownRight className="h-4 w-4" />} tone="red" />
        <SummaryCard title="Net Savings" value={formatMoney(netSavings)} subtitle="Income minus expense" icon={<PiggyBank className="h-4 w-4" />} tone="blue" />
        <SummaryCard title="Savings Rate" value={`${savingsRate.toFixed(1)}%`} subtitle="Savings / income ratio" icon={<CircleDollarSign className="h-4 w-4" />} tone="blue" />
      </section>

      {/* Monthly Trend Area Chart */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <SectionCard title="Monthly Trend" description="Income versus expense over time with a smooth, responsive trend view.">
          <div className="h-[320px] w-full sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsView?.monthlySeries ?? []} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
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
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted))", fontSize: 10, fontWeight: "bold" }} />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted))", fontSize: 10, fontWeight: "bold" }} />
                <Tooltip formatter={(value: number) => formatMoney(Number(value))} contentStyle={{ borderRadius: 8, backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 11, paddingTop: 10, fontWeight: "bold" }} />
                <Area type="monotone" name="Income" dataKey="income" stroke="var(--primary)" fill="url(#incomeFill)" strokeWidth={2} />
                <Area type="monotone" name="Expense" dataKey="expenses" stroke="var(--muted)" fill="url(#expenseFill)" strokeWidth={2} />
                <Line type="monotone" name="Net flow" dataKey="net" stroke="var(--foreground)" strokeWidth={1.5} dot={{ r: 0 }} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Financial Health Score */}
        <SectionCard title="Financial Health" description="A compact score combining savings rate, recurring burden, and concentration risk.">
          <div className="space-y-4">
            <HealthScore score={healthScore} />
            <div className="border border-border bg-sub-card/30 p-6 rounded-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Predicted next month expense</p>
              <p className="mt-2 text-3xl font-heading font-normal text-foreground font-mono">{formatMoney(predictedNextExpense)}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-light">Weighted average from historical monthly expense trends, with more recent periods prioritized.</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Category Breakdown section */}
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Category Breakdown"
          description="Category-wise expense mix with toggleable visualization for executive and technical analysis."
          action={<ToggleSwitch value={categoryView} onChange={setCategoryView} />}
        >
          <div className="space-y-4">
            <div className="border border-sub-border bg-sub-card/60 p-4 transition-all duration-300 rounded-md shadow-sm">
              {categoryView === "pie" ? (
                <CategoryChart categories={sortedCategoryRows} />
              ) : (
                <CategoryTable categories={sortedCategoryRows} sortBy={categorySort} onSortChange={setCategorySort} />
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {categoryInsights.map((insight, index) => (
                <div key={`${index}-${insight}`} className="border border-sub-border bg-sub-card px-4 py-4 text-xs text-muted-foreground font-light rounded-md shadow-sm hover:border-sub-border transition-all duration-150">
                  <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">Insight {index + 1}</p>
                  <p className="mt-1.5 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Anomaly Detection */}
        <SectionCard title="Anomaly Detection" description="Flags recurring debit patterns that stand out by amount or frequency.">
          <div className="space-y-3">
            {anomalyItems.length === 0 && <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">No unusual recurring transactions found.</p>}
            {anomalyItems.map((item) => (
              <div key={`${item.description}-${item.lastSeenAt}`} className="border border-[#dfa88f]/30 bg-[#dfa88f]/5 p-4 rounded-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 font-bold text-foreground text-sm">
                      <AlertTriangle className="h-4 w-4 text-[#c08532]" /> {item.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground font-light">{item.category} • Last seen {item.lastSeenAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-[#c08532] font-mono">{formatMoney(item.averageAmount)}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{item.occurrences} occurrences</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Time-Based Insights */}
        <SectionCard title="Time-Based Insights" description="Compact behavioral signals built from the currently visible analytics model." className="xl:col-span-1">
          <div className="space-y-3">
            {insights.map((insight) => (
              <InsightCard key={insight.title} title={insight.title} text={insight.text} tone={insight.tone} icon={insight.icon} />
            ))}
          </div>
        </SectionCard>

        {/* Payee Concentration Bar Chart */}
        <SectionCard title="Payee Concentration" description="Which payees account for the largest combined movement across visible results." className="xl:col-span-2">
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPayees} layout="vertical" margin={{ left: 12, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="payee" width={120} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted))", fontSize: 10, fontWeight: "bold" }} />
                  <Tooltip formatter={(value: number) => formatMoney(Number(value))} contentStyle={{ borderRadius: 8, backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                  <Bar dataKey="total" radius={6}>
                    {topPayees.map((entry, index) => (
                      <Cell key={entry.payee} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {topPayees.slice(0, 5).map((item) => (
                <div key={item.payee} className="border border-border bg-sub-card/40 px-4 py-3 hover:bg-sub-card transition-colors rounded-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground text-sm">{item.payee}</p>
                      <p className="mt-1 text-xs text-muted-foreground font-light">{item.transactions} transactions</p>
                    </div>
                    <p className="font-semibold text-foreground text-sm font-mono">{formatMoney(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Upload Comparison Line Chart */}
      <div>
        <SectionCard title="Upload Comparison" description="Income, expense, and document activity compared across uploaded statements.">
          <div className="space-y-4">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsView?.documentComparison ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="fileName" hide />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted))", fontSize: 10, fontWeight: "bold" }} />
                  <Tooltip formatter={(value: number) => formatMoney(Number(value))} contentStyle={{ borderRadius: 8, backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                  <Legend iconType="rect" wrapperStyle={{ fontSize: 11, paddingTop: 10, fontWeight: "bold" }} />
                  <Line type="monotone" name="Income" dataKey="income" stroke="var(--primary)" strokeWidth={2} dot={{ r: 0 }} />
                  <Line type="monotone" name="Expense" dataKey="expenses" stroke="var(--muted)" strokeWidth={2} dot={{ r: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {(analyticsView?.documentComparison ?? []).map((item) => (
                <div key={item.fileName} className="flex items-center justify-between border border-border bg-sub-card/40 px-4 py-3 text-sm hover:bg-sub-card transition-colors rounded-md">
                  <div className="min-w-0 pr-4">
                    <p className="truncate font-semibold text-foreground text-xs">{item.fileName}</p>
                    <p className="mt-1 text-xs text-muted-foreground font-light">{item.transactionCount} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary font-mono text-sm">{formatMoney(item.income)}</p>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5 font-mono">{formatMoney(item.expenses)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
