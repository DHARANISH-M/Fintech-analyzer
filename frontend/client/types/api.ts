export interface DemoResponse {
  message: string;
}

export type ExtractionStatus = "uploaded" | "processing" | "completed" | "failed";

export interface DocumentRecord {
  id: number;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  s3Key: string;
  publicUrl: string;
  uploadedAt: string;
  extractionStatus: ExtractionStatus;
  extractionError?: string | null;
  statementStartDate?: string | null;
  statementEndDate?: string | null;
  transactionCount: number;
}

export interface TransactionRecord {
  id: number;
  documentId: number;
  sourceFile: string;
  transactionDate: string;
  postedDate?: string | null;
  description: string;
  payee: string;
  reference?: string | null;
  category: string;
  direction: "credit" | "debit";
  amount: number;
  balance?: number | null;
  currencyCode: string;
  extractionConfidence: number;
  createdAt: string;
}

export interface DashboardMetric {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  latestBalance: number | null;
  transactionCount: number;
  documentsProcessed: number;
  pendingDocuments: number;
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
  closingBalance: number | null;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  direction: "credit" | "debit";
  trend: number;
}

export interface DashboardResponse {
  metrics: DashboardMetric;
  monthlySeries: MonthlyPoint[];
  categoryBreakdown: CategoryBreakdown[];
  topPayees: Array<{
    payee: string;
    debit: number;
    credit: number;
    total: number;
    net: number;
    transactions: number;
    lastPaidAt: string;
  }>;
  payeeLedger: Array<{
    payee: string;
    debit: number;
    credit: number;
    total: number;
    net: number;
    transactions: number;
  }>;
  recentTransactions: TransactionRecord[];
  upcomingRecurring: TransactionRecord[];
}

export interface AnalyticsResponse {
  metrics: DashboardMetric;
  monthlySeries: MonthlyPoint[];
  expenseCategories: CategoryBreakdown[];
  incomeCategories: CategoryBreakdown[];
  recurringTransactions: Array<{
    description: string;
    category: string;
    occurrences: number;
    averageAmount: number;
    lastSeenAt: string;
  }>;
  payeeBreakdown: Array<{
    payee: string;
    debit: number;
    credit: number;
    total: number;
    net: number;
    transactions: number;
    averageDebit: number;
    lastPaidAt: string;
  }>;
  documentComparison: Array<{
    fileName: string;
    income: number;
    expenses: number;
    transactionCount: number;
  }>;
}

export interface AlertRecord {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  reason: string;
  action: string;
}

export interface AlertsResponse {
  alerts: AlertRecord[];
}
