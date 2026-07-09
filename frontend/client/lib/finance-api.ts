import {
  AlertRecord,
  AlertsResponse,
  AnalyticsResponse,
  CategoryBreakdown,
  DashboardMetric,
  DashboardResponse,
  DocumentRecord,
  MonthlyPoint,
  TransactionRecord,
} from "@shared/api";
import ExcelJS from "exceljs";

// Mock Categories configuration
const mockCategories = [
  { name: "Rent & Utilities", payee: "BESCOM Electricity", desc: "BESCOM BILL PAY", amount: 2450, dir: "debit" },
  { name: "Rent & Utilities", payee: "HDFC Home Loan", desc: "EMI INTEREST PAYMENT", amount: 15400, dir: "debit" },
  { name: "Food & Dining", payee: "Zomato", desc: "ZOMATO*ORDER-93821", amount: 480, dir: "debit" },
  { name: "Food & Dining", payee: "Swiggy", desc: "SWIGGY-SUPER-DAILY", amount: 320, dir: "debit" },
  { name: "Food & Dining", payee: "Starbucks Coffee", desc: "STARBUCKS COFFEE IND", amount: 450, dir: "debit" },
  { name: "Software Subs", payee: "Netflix India", desc: "NETFLIX ONLINE SUBS", amount: 649, dir: "debit" },
  { name: "Software Subs", payee: "Spotify Premium", desc: "SPOTIFY MUSIC DIRECT", amount: 119, dir: "debit" },
  { name: "Software Subs", payee: "GitHub", desc: "GITHUB COPILOT SUBS", amount: 820, dir: "debit" },
  { name: "Travel", payee: "Uber India", desc: "UBER RIDE IN-MUMBAI", amount: 380, dir: "debit" },
  { name: "Travel", payee: "Ola Cabs", desc: "OLA RIDE IN-BENGALURU", amount: 290, dir: "debit" },
  { name: "Shopping", payee: "Amazon", desc: "AMZN MKTP IN ORDER", amount: 2499, dir: "debit" },
  { name: "Shopping", payee: "Flipkart", desc: "FLIPKART INTERNET PAY", amount: 1250, dir: "debit" },
  { name: "Shopping", payee: "Myntra Shopping", desc: "MYNTRA APPARELS", amount: 3100, dir: "debit" },
  { name: "Health", payee: "Apollo Pharmacy", desc: "APOLLO MEDS DIRECT", amount: 950, dir: "debit" },
  { name: "Financial Obligations", payee: "HDFC Life", desc: "LIFE INSURANCE PREM", amount: 5200, dir: "debit" },
  { name: "Income", payee: "Company Salary", desc: "NEFT SALARY CREDIT", amount: 92000, dir: "credit" },
  { name: "Income", payee: "Quarterly Interest", desc: "SAVINGS BANK INT CREDIT", amount: 840, dir: "credit" },
  { name: "Credit", payee: "Friend Transfer", desc: "UPI TRANSFER FROM RAHUL", amount: 1500, dir: "credit" },
  { name: "Uncategorized", payee: "Unrecognized POS Merchant", desc: "POS 482910 MERCHANT BENGALURU", amount: 1200, dir: "debit" },
  { name: "Uncategorized", payee: "Transfer UPI Out", desc: "UPI/61928310/PAY TO INDEPENDENT", amount: 3500, dir: "debit" },
  { name: "Uncategorized", payee: "ATM Withdrawal Cash", desc: "ATM WDL INDUSIND BANK", amount: 5000, dir: "debit" }
];

export function buildUserId(): string {
  return (
    localStorage.getItem("user_username") ||
    localStorage.getItem("user_email") ||
    localStorage.getItem("user_id") ||
    "guest"
  );
}

export function getCurrencySymbol(): string {
  return localStorage.getItem("user_currency") || "INR";
}

export function formatMoney(value: number, currency = getCurrencySymbol()): string {
  return `${currency} ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Data Helper Utilities
function getStoredDocuments(): DocumentRecord[] {
  return JSON.parse(localStorage.getItem("mock_documents") || "[]");
}

function saveStoredDocuments(docs: DocumentRecord[]) {
  localStorage.setItem("mock_documents", JSON.stringify(docs));
}

function getStoredTransactions(): TransactionRecord[] {
  return JSON.parse(localStorage.getItem("mock_transactions") || "[]");
}

function saveStoredTransactions(txs: TransactionRecord[]) {
  localStorage.setItem("mock_transactions", JSON.stringify(txs));
}

// Mock Transactions Generator
function generateMockTransactionsList(documentId: number, userId: string, fileName: string): TransactionRecord[] {
  const list: TransactionRecord[] = [];
  const today = new Date();
  let currentBalance = 145000;

  for (let i = 25; i >= 0; i--) {
    const item = mockCategories[Math.floor(Math.random() * mockCategories.length)];
    const txDate = new Date(today);
    txDate.setDate(today.getDate() - i);

    const isCredit = item.dir === "credit";
    if (isCredit) {
      currentBalance += item.amount;
    } else {
      currentBalance -= item.amount;
    }

    list.push({
      id: Date.now() + i,
      documentId,
      sourceFile: fileName,
      transactionDate: txDate.toISOString().slice(0, 10),
      postedDate: txDate.toISOString().slice(0, 10),
      description: item.desc,
      payee: item.payee,
      reference: "TXN" + Math.floor(100000000 + Math.random() * 900000000),
      category: item.name,
      direction: item.dir as "credit" | "debit",
      amount: item.amount,
      balance: currentBalance,
      currencyCode: "INR",
      extractionConfidence: 99,
      createdAt: txDate.toISOString()
    });
  }

  return list.sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
}

// Financial Analytics Calculators
function buildMetrics(transactions: TransactionRecord[], documents: DocumentRecord[]): DashboardMetric {
  const totalIncome = transactions
    .filter((entry) => entry.direction === "credit")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const totalExpenses = transactions
    .filter((entry) => entry.direction === "debit")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const latestBalance = [...transactions]
    .filter((entry) => entry.balance !== null && entry.balance !== undefined)
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())[0]?.balance ?? null;

  const documentsProcessed = documents.filter((d) => d.extractionStatus === "completed").length;
  const pendingDocuments = documents.filter((d) => d.extractionStatus === "processing").length;

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    latestBalance,
    transactionCount: transactions.length,
    documentsProcessed,
    pendingDocuments,
  };
}

function buildMonthlySeries(transactions: TransactionRecord[]): MonthlyPoint[] {
  const grouped = new Map<string, MonthlyPoint>();
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime(),
  );

  for (const transaction of sorted) {
    const key = transaction.transactionDate.slice(0, 7);
    const current = grouped.get(key) ?? {
      month: new Date(transaction.transactionDate).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
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

function buildCategoryBreakdown(transactions: TransactionRecord[], direction: "credit" | "debit"): CategoryBreakdown[] {
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
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      direction,
      trend: (() => {
        const latestAmount = latestMonthTotals.get(category) ?? 0;
        const previousAmount = previousMonthTotals.get(category) ?? 0;

        if (previousAmount > 0) {
          return ((latestAmount - previousAmount) / previousAmount) * 100;
        }
        if (latestAmount > 0) {
          return 100;
        }
        return 0;
      })(),
    }))
    .sort((a, b) => b.amount - a.amount);
}

function buildRecurringTransactions(transactions: TransactionRecord[]) {
  const grouped = new Map<
    string,
    { description: string; category: string; amounts: number[]; lastSeenAt: string }
  >();

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
      averageAmount:
        entry.amounts.reduce((sum, value) => sum + value, 0) / Math.max(entry.amounts.length, 1),
      lastSeenAt: entry.lastSeenAt,
    }))
    .sort((a, b) => b.occurrences - a.occurrences || b.averageAmount - a.averageAmount);
}

function buildPayeeBreakdown(transactions: TransactionRecord[]) {
  const grouped = new Map<
    string,
    { payee: string; debit: number; credit: number; total: number; net: number; transactions: number; lastPaidAt: string }
  >();

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

function buildPayeeLedger(transactions: TransactionRecord[]) {
  const grouped = new Map<
    string,
    { payee: string; debit: number; credit: number; total: number; net: number; transactions: number }
  >();

  for (const transaction of transactions) {
    const payee = transaction.payee;
    const current = grouped.get(payee) ?? {
      payee,
      debit: 0,
      credit: 0,
      total: 0,
      net: 0,
      transactions: 0,
    };

    if (transaction.direction === "debit") {
      current.debit += Number(transaction.amount);
    } else {
      current.credit += Number(transaction.amount);
    }

    current.total = current.debit + current.credit;
    current.net = current.credit - current.debit;
    current.transactions += 1;
    grouped.set(payee, current);
  }

  return Array.from(grouped.values()).sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || b.debit - a.debit);
}

function buildAlerts(transactions: TransactionRecord[]): AlertRecord[] {
  const alerts: AlertRecord[] = [];
  const monthly = buildMonthlySeries(transactions);

  if (monthly.length >= 2) {
    const latest = monthly[monthly.length - 1];
    const previous = monthly[monthly.length - 2];
    if (previous.expenses > 0) {
      const change = ((latest.expenses - previous.expenses) / previous.expenses) * 100;
      if (change >= 25) {
        alerts.push({
          id: "expense-spike",
          severity: change >= 50 ? "high" : "medium",
          title: "Expense spike detected",
          reason: `Expenses increased by ${change.toFixed(1)}% in ${latest.month} compared with ${previous.month}.`,
          action: "Review the latest debits and confirm whether the higher outflow is expected.",
        });
      }
    }
  }

  const duplicates = new Map<string, TransactionRecord[]>();
  for (const transaction of transactions) {
    const key = [
      transaction.transactionDate,
      transaction.direction,
      transaction.amount.toFixed(2),
      transaction.description.toLowerCase(),
    ].join("::");

    const bucket = duplicates.get(key) ?? [];
    bucket.push(transaction);
    duplicates.set(key, bucket);
  }

  const duplicateGroup = Array.from(duplicates.values()).find((group) => group.length > 1);
  if (duplicateGroup) {
    const entry = duplicateGroup[0];
    alerts.push({
      id: "duplicate-transaction",
      severity: "medium",
      title: "Possible duplicate transaction",
      reason: `Multiple ${entry.direction} entries with the same amount and description were found on ${entry.transactionDate}.`,
      action: "Cross-check the statement and contact your bank if one of the charges should not be there.",
    });
  }

  const largestDebit = transactions
    .filter((entry) => entry.direction === "debit")
    .sort((a, b) => Number(b.amount) - Number(a.amount))[0];

  if (largestDebit) {
    alerts.push({
      id: "largest-debit",
      severity: "low",
      title: "Largest debit this period",
      reason: `${largestDebit.description} is the biggest debit at ${largestDebit.amount.toFixed(2)} on ${largestDebit.transactionDate}.`,
      action: "Use this as a quick review point when validating high-value expenses.",
    });
  }

  return alerts;
}

// Initial Seeding logic
function initializeMockData() {
  if (!localStorage.getItem("mock_users")) {
    localStorage.setItem("mock_users", JSON.stringify([
      {
        id: 1,
        name: "Demo User",
        username: "demouser",
        email: "test@example.com",
        password: "password123",
        phone: "1234567890",
        currency: "INR"
      }
    ]));
  }

  if (!localStorage.getItem("mock_documents")) {
    const today = new Date();
    const dateStart = new Date(today);
    dateStart.setDate(today.getDate() - 30);

    const doc1: DocumentRecord = {
      id: 1,
      userId: "demouser",
      fileName: "SBI_Statement_May2026.pdf",
      fileType: "application/pdf",
      fileSize: 452812,
      s3Key: "users/demouser/documents/1_SBI_Statement.pdf",
      publicUrl: "#",
      uploadedAt: new Date(today.getTime() - 24 * 3600 * 1000 * 12).toISOString(),
      extractionStatus: "completed",
      extractionError: null,
      statementStartDate: dateStart.toISOString().slice(0, 10),
      statementEndDate: today.toISOString().slice(0, 10),
      transactionCount: 22
    };

    saveStoredDocuments([doc1]);

    const txs: TransactionRecord[] = [];
    let currentBalance = 145000;
    
    for (let i = 22; i >= 0; i--) {
      const item = mockCategories[i % mockCategories.length];
      const txDate = new Date(today);
      txDate.setDate(today.getDate() - i);
      
      const isCredit = item.dir === "credit";
      if (isCredit) {
        currentBalance += item.amount;
      } else {
        currentBalance -= item.amount;
      }

      txs.push({
        id: 22 - i + 1,
        documentId: 1,
        sourceFile: "SBI_Statement_May2026.pdf",
        transactionDate: txDate.toISOString().slice(0, 10),
        postedDate: txDate.toISOString().slice(0, 10),
        description: item.desc,
        payee: item.payee,
        reference: "TXN" + Math.floor(100000000 + Math.random() * 900000000),
        category: item.name,
        direction: item.dir as "credit" | "debit",
        amount: item.amount,
        balance: currentBalance,
        currencyCode: "INR",
        extractionConfidence: 98,
        createdAt: txDate.toISOString()
      });
    }

    saveStoredTransactions(txs);
  }
}

export function seedUserMockData(userId: string) {
  const docs = getStoredDocuments();
  const userDocs = docs.filter((d) => d.userId === userId);
  if (userDocs.length > 0) {
    return;
  }

  const today = new Date();
  const dateStart = new Date(today);
  dateStart.setDate(today.getDate() - 30);

  const nextDocId = docs.length > 0 ? Math.max(...docs.map((d) => Number(d.id))) + 1 : 1;

  const doc1: DocumentRecord = {
    id: nextDocId,
    userId: userId,
    fileName: "SBI_Statement_May2026.pdf",
    fileType: "application/pdf",
    fileSize: 452812,
    s3Key: `users/${userId}/documents/${nextDocId}_SBI_Statement.pdf`,
    publicUrl: "#",
    uploadedAt: new Date(today.getTime() - 24 * 3600 * 1000 * 12).toISOString(),
    extractionStatus: "completed",
    extractionError: null,
    statementStartDate: dateStart.toISOString().slice(0, 10),
    statementEndDate: today.toISOString().slice(0, 10),
    transactionCount: 22
  };

  docs.push(doc1);
  saveStoredDocuments(docs);

  const txs = getStoredTransactions();
  let currentBalance = 145000;
  
  for (let i = 22; i >= 0; i--) {
    const item = mockCategories[i % mockCategories.length];
    const txDate = new Date(today);
    txDate.setDate(today.getDate() - i);
    
    const isCredit = item.dir === "credit";
    if (isCredit) {
      currentBalance += item.amount;
    } else {
      currentBalance -= item.amount;
    }

    const nextTxId = txs.length > 0 ? Math.max(...txs.map((t) => Number(t.id))) + 1 : 1;

    txs.push({
      id: nextTxId,
      documentId: nextDocId,
      sourceFile: "SBI_Statement_May2026.pdf",
      transactionDate: txDate.toISOString().slice(0, 10),
      postedDate: txDate.toISOString().slice(0, 10),
      description: item.desc,
      payee: item.payee,
      reference: "TXN" + Math.floor(100000000 + Math.random() * 900000000),
      category: item.name,
      direction: item.dir as "credit" | "debit",
      amount: item.amount,
      balance: currentBalance,
      currencyCode: "INR",
      extractionConfidence: 98,
      createdAt: txDate.toISOString()
    });
  }

  saveStoredTransactions(txs);
}

// Client API Exports calling real backend REST endpoints
export async function fetchDocuments(): Promise<{ documents: DocumentRecord[] }> {
  const response = await fetch("/api/statements");
  if (!response.ok) {
    throw new Error("Failed to fetch documents from database.");
  }
  return response.json();
}

export async function deleteDocument(documentId: number | string): Promise<{ success: true }> {
  const response = await fetch(`/api/statements/${documentId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete statement from database.");
  }
  return response.json();
}

export async function fetchTransactions(): Promise<{ transactions: TransactionRecord[] }> {
  const response = await fetch("/api/transactions");
  if (!response.ok) {
    throw new Error("Failed to fetch transactions from database.");
  }
  return response.json();
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard metrics.");
  }
  return response.json();
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const response = await fetch("/api/analytics");
  if (!response.ok) {
    throw new Error("Failed to fetch analytics from database.");
  }
  return response.json();
}

export async function fetchAlerts(): Promise<AlertsResponse> {
  const response = await fetch("/api/alerts");
  if (!response.ok) {
    throw new Error("Failed to fetch alerts from database.");
  }
  return response.json();
}

// Dynamic Client-side Excel Spreadsheet Generation using live database records
export async function downloadDocumentSpreadsheet(documentId: number | string, fileName: string) {
  const { documents } = await fetchDocuments();
  const doc = documents.find((d) => d.id === documentId);
  if (!doc) {
    alert("Document not found");
    return;
  }

  const { transactions } = await fetchTransactions();
  const documentTransactions = transactions
    .filter((t) => t.documentId === documentId)
    .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));

  if (documentTransactions.length === 0) {
    alert("No extracted transactions are available for this document yet.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LedgerLens";
  workbook.company = "LedgerLens";
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Summary Sheet
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 28 },
    { header: "Value", key: "value", width: 24 },
  ];
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };

  const incomeTotal = documentTransactions
    .filter((t) => t.direction === "credit")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = documentTransactions
    .filter((t) => t.direction === "debit")
    .reduce((sum, t) => sum + t.amount, 0);
  const netMovement = incomeTotal - expenseTotal;

  summarySheet.addRows([
    { metric: "Source file", value: doc.fileName },
    { metric: "Statement start date", value: doc.statementStartDate || "" },
    { metric: "Statement end date", value: doc.statementEndDate || "" },
    { metric: "Transactions extracted", value: documentTransactions.length },
    { metric: "Total income", value: incomeTotal },
    { metric: "Total expense", value: expenseTotal },
    { metric: "Net movement", value: netMovement },
  ]);

  for (let rowIndex = 2; rowIndex <= summarySheet.rowCount; rowIndex += 1) {
    const valueCell = summarySheet.getCell(`B${rowIndex}`);
    if (typeof valueCell.value === "number") {
      valueCell.numFmt = "#,##0.00";
    }
  }

  // 2. Transactions Sheet
  const statementSheet = workbook.addWorksheet("Transactions");
  statementSheet.columns = [
    { header: "Transaction Date", key: "transactionDate", width: 16 },
    { header: "Posted Date", key: "postedDate", width: 16 },
    { header: "Description", key: "description", width: 38 },
    { header: "Payee", key: "payee", width: 28 },
    { header: "Reference", key: "reference", width: 22 },
    { header: "Category", key: "category", width: 18 },
    { header: "Direction", key: "direction", width: 14 },
    { header: "Amount", key: "amount", width: 16 },
    { header: "Balance", key: "balance", width: 16 },
    { header: "Currency", key: "currencyCode", width: 12 },
    { header: "Confidence", key: "extractionConfidence", width: 14 },
    { header: "Source File", key: "sourceFile", width: 28 },
  ];

  const headerRow = statementSheet.getRow(1);
  headerRow.height = 22;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D4ED8" },
  };
  headerRow.alignment = { vertical: "middle" };

  documentTransactions.forEach((t) => {
    statementSheet.addRow({
      transactionDate: t.transactionDate,
      postedDate: t.postedDate ?? "",
      description: t.description,
      payee: t.payee,
      reference: t.reference ?? "",
      category: t.category,
      direction: t.direction,
      amount: t.amount,
      balance: t.balance ?? "",
      currencyCode: t.currencyCode,
      extractionConfidence: t.extractionConfidence / 100,
      sourceFile: doc.fileName,
    });
  });

  statementSheet.getColumn("amount").numFmt = "#,##0.00";
  statementSheet.getColumn("balance").numFmt = "#,##0.00";
  statementSheet.getColumn("extractionConfidence").numFmt = "0.00%";

  statementSheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "top", wrapText: true };
    if (rowNumber === 1) return;

    const directionCell = row.getCell("direction");
    const amountCell = row.getCell("amount");

    if (directionCell.value === "credit") {
      amountCell.font = { color: { argb: "FF047857" }, bold: true };
    } else if (directionCell.value === "debit") {
      amountCell.font = { color: { argb: "FFBE123C" }, bold: true };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  
  const downloadName = String(fileName)
    .replace(/\.pdf$/i, "")
    .replace(/[^\w.-]+/g, "_");

  a.download = `${downloadName}_structured.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Intercept Global fetch calls to automatically inject JWT authentication headers and handle authorization redirects
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input.toString();

  // Inject Authorization Token for all requests to backend APIs
  if (url.includes("/api/") && !url.includes("/api/login") && !url.includes("/api/signup") && !url.includes("/api/health")) {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.warn("No auth token found. Redirecting to login.");
      // Redirect to login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/enhanced/login";
      }
      return new Response(JSON.stringify({ message: "Unauthorized: Missing token." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newInit = { ...init };
    const headers = new Headers(newInit.headers || {});
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    newInit.headers = headers;

    try {
      const response = await originalFetch(input, newInit);
      if (response.status === 401) {
        console.warn("Token expired or invalid (401). Redirecting to login.");
        localStorage.removeItem("auth_token");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/enhanced/login";
        }
      }
      return response;
    } catch (fetchErr) {
      console.error("Network error during API call:", fetchErr);
      throw fetchErr;
    }
  }

  return originalFetch(input, init);
};
