import { CategoryBreakdown, DashboardMetric, MonthlyPoint, TransactionRecord } from "@shared/api";

/**
 * Normalizes transaction description text by converting to lowercase,
 * trimming, and stripping trailing date patterns, reference codes, 
 * or transaction IDs so merchants can be grouped together.
 */
export function normalizeDescription(description: string): string {
  if (!description) return "unknown";
  
  // Lowercase
  let normalized = description.toLowerCase();
  
  // Strip date patterns (e.g., 2026/05 or 15-06)
  normalized = normalized.replace(/\b\d{1,2}[\-\/]\d{1,2}([\-\/]\d{2,4})?\b/g, "");
  normalized = normalized.replace(/\b\d{4}[\-\/]\d{1,2}\b/g, "");
  
  // Strip long number sequences (typically IDs)
  normalized = normalized.replace(/\b\d{5,}\b/g, "");
  
  // Strip trailing numbers (e.g. -93821)
  normalized = normalized.replace(/[\-\*#\s_]+\d+/g, " ");
  
  // Strip punctuation
  normalized = normalized.replace(/[^a-z0-9\s]/g, " ");
  
  // Trim and collapse whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();
  
  return normalized || description.toLowerCase().trim();
}

// Exchange rates relative to INR (base rate = 1.0)
const EXCHANGE_RATES: Record<string, number> = {
  INR: 1.0,
  USD: 83.0,
  EUR: 90.0,
  GBP: 105.0,
};

/**
 * Converts a currency value into the target currency using fixed exchange rates.
 */
export function convertCurrency(amount: number, from: string, to: string): number {
  const fromRate = EXCHANGE_RATES[from?.toUpperCase()] ?? 1.0;
  const toRate = EXCHANGE_RATES[to?.toUpperCase()] ?? 1.0;
  
  const amountInINR = amount * fromRate;
  return amountInINR / toRate;
}

/**
 * Computes base metrics from the given transactions list.
 */
export function buildMetricsFromTransactions(
  transactions: TransactionRecord[],
  targetCurrency = "INR"
): { totalIncome: number; totalExpense: number; netBalance: number; transactionCount: number; latestBalance: number | null } {
  let totalIncome = 0;
  let totalExpense = 0;
  
  for (const entry of transactions) {
    const convertedAmount = convertCurrency(Number(entry.amount), entry.currencyCode, targetCurrency);
    if (entry.direction === "credit") {
      totalIncome += convertedAmount;
    } else {
      totalExpense += convertedAmount;
    }
  }
  
  // Latest balance is from the chronologically most recent transaction with a valid balance field
  const sorted = [...transactions]
    .filter((entry) => entry.balance !== null && entry.balance !== undefined)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
    
  const latestBalanceVal = sorted[0]?.balance ?? null;
  const latestBalance = latestBalanceVal !== null 
    ? convertCurrency(Number(latestBalanceVal), sorted[0].currencyCode, targetCurrency)
    : null;
    
  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    transactionCount: transactions.length,
    latestBalance,
  };
}

/**
 * Groups credit and debit totals month-by-month and returns them chronologically.
 */
export function buildMonthlySeriesFromTransactions(
  transactions: TransactionRecord[],
  targetCurrency = "INR"
): MonthlyPoint[] {
  const grouped = new Map<string, { month: string; income: number; expenses: number; net: number; closingBalance: number | null; lastTxDate: string }>();
  
  const sorted = [...transactions].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
  
  for (const entry of sorted) {
    const key = entry.transactionDate.slice(0, 7); // YYYY-MM
    const convertedAmount = convertCurrency(Number(entry.amount), entry.currencyCode, targetCurrency);
    
    const current = grouped.get(key) ?? {
      month: new Date(entry.transactionDate).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      income: 0,
      expenses: 0,
      net: 0,
      closingBalance: null,
      lastTxDate: "",
    };
    
    if (entry.direction === "credit") {
      current.income += convertedAmount;
    } else {
      current.expenses += convertedAmount;
    }
    
    current.net = current.income - current.expenses;
    
    if (entry.balance !== null && entry.balance !== undefined && entry.transactionDate >= current.lastTxDate) {
      current.closingBalance = convertCurrency(Number(entry.balance), entry.currencyCode, targetCurrency);
      current.lastTxDate = entry.transactionDate;
    }
    
    grouped.set(key, current);
  }
  
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, val]) => ({
      month: val.month,
      income: val.income,
      expenses: val.expenses,
      net: val.net,
      closingBalance: val.closingBalance,
    }));
}

/**
 * Builds a category breakdown with Month-over-Month (MoM) trend changes.
 */
export function buildCategoryBreakdownFromTransactions(
  transactions: TransactionRecord[],
  direction: "credit" | "debit" = "debit",
  targetCurrency = "INR"
): CategoryBreakdown[] {
  const relevant = transactions.filter((entry) => entry.direction === direction);
  const total = relevant.reduce((sum, entry) => sum + convertCurrency(Number(entry.amount), entry.currencyCode, targetCurrency), 0);
  
  const groupedAmounts = new Map<string, number>();
  const monthlyCategoryTotals = new Map<string, Map<string, number>>();
  
  for (const entry of relevant) {
    const convertedAmount = convertCurrency(Number(entry.amount), entry.currencyCode, targetCurrency);
    groupedAmounts.set(entry.category, (groupedAmounts.get(entry.category) ?? 0) + convertedAmount);
    
    const monthKey = entry.transactionDate.slice(0, 7); // YYYY-MM
    const monthBucket = monthlyCategoryTotals.get(monthKey) ?? new Map<string, number>();
    monthBucket.set(entry.category, (monthBucket.get(entry.category) ?? 0) + convertedAmount);
    monthlyCategoryTotals.set(monthKey, monthBucket);
  }
  
  // MoM trend calculation: latest month vs the month prior to that
  const monthKeys = Array.from(monthlyCategoryTotals.keys()).sort((a, b) => a.localeCompare(b));
  const latestMonthKey = monthKeys[monthKeys.length - 1];
  const previousMonthKey = monthKeys[monthKeys.length - 2];
  
  const latestMonthTotals = latestMonthKey ? (monthlyCategoryTotals.get(latestMonthKey) ?? new Map<string, number>()) : new Map<string, number>();
  const previousMonthTotals = previousMonthKey ? (monthlyCategoryTotals.get(previousMonthKey) ?? new Map<string, number>()) : new Map<string, number>();
  
  return Array.from(groupedAmounts.entries())
    .map(([category, amount]) => {
      const latestAmount = latestMonthTotals.get(category) ?? 0;
      const previousAmount = previousMonthTotals.get(category) ?? 0;
      let trend = 0;
      
      if (previousAmount > 0) {
        trend = ((latestAmount - previousAmount) / previousAmount) * 100;
      } else if (latestAmount > 0) {
        trend = 100; // 100% spike if no spend last month
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

/**
 * Identifies and aggregates recurring debit entries.
 */
export function buildRecurringTransactionsFromTransactions(
  transactions: TransactionRecord[],
  targetCurrency = "INR"
): Array<{ description: string; category: string; occurrences: number; averageAmount: number; lastAmount: number; lastDate: string; frequency: string }> {
  const debits = transactions.filter((entry) => entry.direction === "debit");
  const grouped = new Map<string, { originalDescription: string; category: string; amounts: number[]; dates: string[] }>();
  
  for (const entry of debits) {
    const key = `${normalizeDescription(entry.description)}::${entry.category}`;
    const convertedAmount = convertCurrency(Number(entry.amount), entry.currencyCode, targetCurrency);
    
    const current = grouped.get(key) ?? {
      originalDescription: entry.description,
      category: entry.category,
      amounts: [],
      dates: [],
    };
    
    current.amounts.push(convertedAmount);
    current.dates.push(entry.transactionDate);
    grouped.set(key, current);
  }
  
  return Array.from(grouped.values())
    .filter((entry) => entry.amounts.length > 1)
    .map((entry) => {
      const occurrences = entry.amounts.length;
      const totalAmount = entry.amounts.reduce((sum, val) => sum + val, 0);
      const averageAmount = totalAmount / occurrences;
      
      // Sort dates chronologically to find latest information
      const sortedIndexes = Array.from({ length: occurrences }, (_, i) => i)
        .sort((a, b) => entry.dates[a].localeCompare(entry.dates[b]));
        
      const lastIndex = sortedIndexes[occurrences - 1];
      const lastAmount = entry.amounts[lastIndex];
      const lastDate = entry.dates[lastIndex];
      
      // Frequency estimation based on the average gap in days
      const sortedDates = sortedIndexes.map((idx) => new Date(entry.dates[idx]));
      let totalGaps = 0;
      for (let i = 1; i < sortedDates.length; i++) {
        const diffMs = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
        totalGaps += diffMs / (1000 * 60 * 60 * 24);
      }
      const avgGap = occurrences > 1 ? totalGaps / (occurrences - 1) : 0;
      
      let frequency = "Flexible";
      if (avgGap >= 5 && avgGap <= 9) frequency = "Weekly";
      else if (avgGap >= 10 && avgGap <= 18) frequency = "Bi-weekly";
      else if (avgGap >= 25 && avgGap <= 35) frequency = "Monthly";
      else if (avgGap >= 80 && avgGap <= 100) frequency = "Quarterly";
      else if (avgGap >= 350 && avgGap <= 380) frequency = "Annually";
      
      return {
        description: entry.originalDescription,
        category: entry.category,
        occurrences,
        averageAmount,
        lastAmount,
        lastDate,
        frequency,
      };
    })
    .sort((a, b) => b.occurrences - a.occurrences || b.averageAmount - a.averageAmount);
}

/**
 * Aggregates transaction counts and credit/debit levels per payee.
 */
export function buildPayeeBreakdownFromTransactions(
  transactions: TransactionRecord[],
  targetCurrency = "INR"
): Array<{ payee: string; totalCredit: number; totalDebit: number; total: number; net: number; transactionCount: number; averageDebit: number; lastPaidAt: string }> {
  const grouped = new Map<string, { credit: number; debit: number; count: number; lastDate: string }>();
  
  for (const entry of transactions) {
    const payee = entry.payee || "Unknown Payee";
    const convertedAmount = convertCurrency(Number(entry.amount), entry.currencyCode, targetCurrency);
    
    const current = grouped.get(payee) ?? {
      credit: 0,
      debit: 0,
      count: 0,
      lastDate: "",
    };
    
    if (entry.direction === "credit") {
      current.credit += convertedAmount;
    } else {
      current.debit += convertedAmount;
    }
    current.count += 1;
    
    if (entry.transactionDate > current.lastDate) {
      current.lastDate = entry.transactionDate;
    }
    
    grouped.set(payee, current);
  }
  
  return Array.from(grouped.entries())
    .map(([payee, val]) => ({
      payee,
      totalCredit: val.credit,
      totalDebit: val.debit,
      total: val.debit + val.credit,
      net: val.credit - val.debit,
      transactionCount: val.count,
      averageDebit: val.debit / val.count,
      lastPaidAt: val.lastDate,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Compares transaction summaries grouped by source statement.
 */
export function buildDocumentComparisonFromTransactions(
  transactions: TransactionRecord[],
  targetCurrency = "INR"
): Array<{ fileName: string; income: number; expenses: number; transactionCount: number; dateRange: string }> {
  const grouped = new Map<string, { income: number; expenses: number; count: number; dates: string[] }>();
  
  for (const entry of transactions) {
    const source = entry.sourceFile || "Unknown Document";
    const convertedAmount = convertCurrency(Number(entry.amount), entry.currencyCode, targetCurrency);
    
    const current = grouped.get(source) ?? {
      income: 0,
      expenses: 0,
      count: 0,
      dates: [],
    };
    
    if (entry.direction === "credit") {
      current.income += convertedAmount;
    } else {
      current.expenses += convertedAmount;
    }
    current.count += 1;
    current.dates.push(entry.transactionDate);
    
    grouped.set(source, current);
  }
  
  return Array.from(grouped.entries())
    .map(([fileName, val]) => {
      let dateRange = "N/A";
      if (val.dates.length > 0) {
        val.dates.sort((a, b) => a.localeCompare(b));
        const minDate = val.dates[0];
        const maxDate = val.dates[val.dates.length - 1];
        dateRange = minDate === maxDate ? minDate : `${minDate} to ${maxDate}`;
      }
      
      return {
        fileName,
        income: val.income,
        expenses: val.expenses,
        transactionCount: val.count,
        dateRange,
      };
    })
    .sort((a, b) => b.transactionCount - a.transactionCount);
}

/**
 * Computes a financial health score (0–100) combining savings rate, 
 * recurring bills burden, and payee concentration penalty.
 * 
 * Formula:
 * - Base score contribution: 50 points
 * - Savings rate contribution: up to 30 points (linear scaling: savingsRate * 1.0, capped at 30, negative down to -30)
 * - Recurring bills penalty: -2 points per recurring bill type detected, capped at -20 points
 * - Payee concentration penalty: -20 points * (highest payee debit / total debit) percentage, capped at -20 points
 */
export function healthScore({
  savingsRate,
  recurringBillCount,
  payeeConcentration,
}: {
  savingsRate: number;
  recurringBillCount: number;
  payeeConcentration: number;
}): { total: number; savingsRateContribution: number; recurringBillPenalty: number; payeeConcentrationPenalty: number; baseScore: number } {
  const baseScore = 50;
  
  // Savings rate contribution (clamped between -30 and 30)
  const savingsRateContribution = Math.max(-30, Math.min(30, Math.round(savingsRate * 1.0)));
  
  // Recurring bill count penalty (capped at 20 points)
  const recurringBillPenalty = -Math.min(20, recurringBillCount * 2);
  
  // Payee concentration penalty (clamped between 0 and 20 points)
  const payeeConcentrationPenalty = -Math.min(20, Math.round(payeeConcentration * 20));
  
  // Total score clamped between 0 and 100
  const rawTotal = baseScore + savingsRateContribution + recurringBillPenalty + payeeConcentrationPenalty;
  const total = Math.max(0, Math.min(100, rawTotal));
  
  return {
    total,
    savingsRateContribution,
    recurringBillPenalty,
    payeeConcentrationPenalty,
    baseScore,
  };
}

/**
 * Calculates a weighted average predicted expense for the next month 
 * based on linear decay of recent monthly expenses (more recent weighted higher).
 * 
 * Also computes variance and confidence level based on standard deviation.
 */
export function predictedNextExpense(monthlySeries: MonthlyPoint[]): {
  prediction: number;
  variance: number;
  confidence: "High" | "Medium" | "Low" | "No Data";
} {
  if (!monthlySeries || monthlySeries.length === 0) {
    return { prediction: 0, variance: 0, confidence: "No Data" };
  }
  
  const N = monthlySeries.length;
  if (N === 1) {
    return { prediction: monthlySeries[0].expenses, variance: 0, confidence: "Low" };
  }
  
  // Assign linear weights: newest month has weight N, oldest has weight 1
  let weightedSum = 0;
  let totalWeights = 0;
  
  for (let i = 0; i < N; i++) {
    const weight = i + 1;
    weightedSum += monthlySeries[i].expenses * weight;
    totalWeights += weight;
  }
  
  const prediction = weightedSum / totalWeights;
  
  // Calculate weighted variance
  let weightedVarianceSum = 0;
  for (let i = 0; i < N; i++) {
    const weight = i + 1;
    const diff = monthlySeries[i].expenses - prediction;
    weightedVarianceSum += weight * (diff * diff);
  }
  const variance = weightedVarianceSum / totalWeights;
  const stdDev = Math.sqrt(variance);
  
  // Compute coefficient of variation to assign confidence ratings
  const cv = prediction > 0 ? stdDev / prediction : 0;
  
  let confidence: "High" | "Medium" | "Low" = "Low";
  if (cv < 0.15) {
    confidence = "High";
  } else if (cv < 0.35) {
    confidence = "Medium";
  }
  
  return {
    prediction,
    variance,
    confidence,
  };
}
