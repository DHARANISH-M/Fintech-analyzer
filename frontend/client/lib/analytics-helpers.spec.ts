import { describe, it, expect } from "vitest";
import { TransactionRecord, MonthlyPoint } from "@shared/api";
import {
  normalizeDescription,
  convertCurrency,
  buildMetricsFromTransactions,
  buildMonthlySeriesFromTransactions,
  buildCategoryBreakdownFromTransactions,
  buildRecurringTransactionsFromTransactions,
  buildPayeeBreakdownFromTransactions,
  buildDocumentComparisonFromTransactions,
  healthScore,
  predictedNextExpense,
} from "./analytics-helpers";

const createMockTx = (overrides: Partial<TransactionRecord> = {}): TransactionRecord => ({
  id: Math.floor(Math.random() * 100000),
  documentId: 1,
  sourceFile: "statement_1.pdf",
  transactionDate: "2026-06-15",
  postedDate: "2026-06-15",
  description: "POS PURCHASE ZOMATO-93821",
  payee: "Zomato",
  reference: "REF12345",
  category: "Food & Dining",
  direction: "debit",
  amount: 250,
  balance: 10000,
  currencyCode: "INR",
  extractionConfidence: 98,
  createdAt: "2026-06-15T12:00:00Z",
  ...overrides,
});

describe("Analytics Pure Helper Functions", () => {
  
  describe("normalizeDescription", () => {
    it("should handle empty or null values", () => {
      expect(normalizeDescription("")).toBe("unknown");
    });
    
    it("should normalize description text correctly by stripping trailing references and numeric sequences", () => {
      expect(normalizeDescription("ZOMATO*ORDER-93821")).toBe("zomato order");
      expect(normalizeDescription("BESCOM ELECTRICITY BILL 2026/05")).toBe("bescom electricity bill");
      expect(normalizeDescription("UPI/61928310/PAY TO FRIEND")).toBe("upi pay to friend");
    });
  });

  describe("convertCurrency", () => {
    it("should handle converting from/to same currency without adjustment", () => {
      expect(convertCurrency(100, "INR", "INR")).toBe(100);
      expect(convertCurrency(50.5, "USD", "USD")).toBe(50.5);
    });
    
    it("should perform conversions based on fixed rates", () => {
      // 1 USD = 83 INR, convert 2 USD to INR
      expect(convertCurrency(2, "USD", "INR")).toBe(166);
      // 166 INR to USD
      expect(convertCurrency(166, "INR", "USD")).toBe(2);
      // USD to EUR cross rate: USD -> INR (83) -> EUR (83 / 90)
      expect(convertCurrency(90, "USD", "EUR")).toBe(83);
    });
  });

  describe("buildMetricsFromTransactions", () => {
    it("should handle empty input array", () => {
      const result = buildMetricsFromTransactions([]);
      expect(result).toEqual({
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        transactionCount: 0,
        latestBalance: null,
      });
    });

    it("should process single credit transaction", () => {
      const txs = [createMockTx({ direction: "credit", amount: 500, balance: 10500 })];
      const result = buildMetricsFromTransactions(txs);
      expect(result).toEqual({
        totalIncome: 500,
        totalExpense: 0,
        netBalance: 500,
        transactionCount: 1,
        latestBalance: 10500,
      });
    });

    it("should aggregate mixed credits and debits and convert currencies", () => {
      const txs = [
        createMockTx({ direction: "credit", amount: 1000, currencyCode: "INR", transactionDate: "2026-06-01", balance: 5000 }),
        createMockTx({ direction: "debit", amount: 10, currencyCode: "USD", transactionDate: "2026-06-02", balance: 4170 }), // 10 USD * 83 = 830 INR
      ];
      const result = buildMetricsFromTransactions(txs, "INR");
      expect(result.totalIncome).toBe(1000);
      expect(result.totalExpense).toBe(830);
      expect(result.netBalance).toBe(170);
      expect(result.transactionCount).toBe(2);
      expect(result.latestBalance).toBe(346110); // latest balance is from 2026-06-02, which is 4170 USD -> 346,110 INR
    });
  });

  describe("buildMonthlySeriesFromTransactions", () => {
    it("should handle empty input", () => {
      expect(buildMonthlySeriesFromTransactions([])).toEqual([]);
    });

    it("should group and sort multi-month data correctly", () => {
      const txs = [
        createMockTx({ transactionDate: "2026-05-10", direction: "debit", amount: 100, balance: 9000 }),
        createMockTx({ transactionDate: "2026-06-12", direction: "credit", amount: 1000, balance: 10000 }),
        createMockTx({ transactionDate: "2026-05-20", direction: "credit", amount: 500, balance: 9500 }),
      ];
      
      const result = buildMonthlySeriesFromTransactions(txs, "INR");
      expect(result.length).toBe(2);
      
      // May 2026
      expect(result[0].month).toContain("May");
      expect(result[0].income).toBe(500);
      expect(result[0].expenses).toBe(100);
      expect(result[0].net).toBe(400);
      expect(result[0].closingBalance).toBe(9500); // latest balance chronologically in May
      
      // June 2026
      expect(result[1].month).toContain("Jun");
      expect(result[1].income).toBe(1000);
      expect(result[1].expenses).toBe(0);
      expect(result[1].net).toBe(1000);
      expect(result[1].closingBalance).toBe(10000);
    });
  });

  describe("buildCategoryBreakdownFromTransactions", () => {
    it("should handle empty input", () => {
      expect(buildCategoryBreakdownFromTransactions([])).toEqual([]);
    });

    it("should calculate category proportions and MoM trends", () => {
      const txs = [
        createMockTx({ transactionDate: "2026-05-01", category: "Shopping", direction: "debit", amount: 100 }),
        createMockTx({ transactionDate: "2026-06-01", category: "Shopping", direction: "debit", amount: 150 }), // MoM trend = +50%
        createMockTx({ transactionDate: "2026-06-02", category: "Food", direction: "debit", amount: 50 }),
      ];
      
      const result = buildCategoryBreakdownFromTransactions(txs, "debit", "INR");
      expect(result.length).toBe(2);
      
      const shopping = result.find(c => c.category === "Shopping");
      const food = result.find(c => c.category === "Food");
      
      expect(shopping?.amount).toBe(250);
      expect(shopping?.percentage).toBe(83.33333333333334);
      expect(shopping?.trend).toBe(50); // increased from 100 to 150
      
      expect(food?.amount).toBe(50);
      expect(food?.percentage).toBe(16.666666666666664);
      expect(food?.trend).toBe(100); // 100% since no previous month spend
    });
  });

  describe("buildRecurringTransactionsFromTransactions", () => {
    it("should filter groups with single occurrences", () => {
      const txs = [
        createMockTx({ description: "Netflix Sub", direction: "debit", amount: 199 }),
      ];
      expect(buildRecurringTransactionsFromTransactions(txs)).toEqual([]);
    });

    it("should detect recurring transactions and estimate frequency", () => {
      const txs = [
        createMockTx({ description: "Netflix Sub-9182", category: "Subs", transactionDate: "2026-04-01", direction: "debit", amount: 200 }),
        createMockTx({ description: "Netflix Sub-8492", category: "Subs", transactionDate: "2026-05-01", direction: "debit", amount: 200 }),
        createMockTx({ description: "Netflix Sub-0021", category: "Subs", transactionDate: "2026-06-01", direction: "debit", amount: 200 }),
      ];
      
      const result = buildRecurringTransactionsFromTransactions(txs, "INR");
      expect(result.length).toBe(1);
      expect(result[0].description).toBe("Netflix Sub-9182"); // matches first occurrence description name
      expect(result[0].occurrences).toBe(3);
      expect(result[0].averageAmount).toBe(200);
      expect(result[0].lastAmount).toBe(200);
      expect(result[0].lastDate).toBe("2026-06-01");
      expect(result[0].frequency).toBe("Monthly"); // ~30 days apart
    });
  });

  describe("buildPayeeBreakdownFromTransactions", () => {
    it("should handle empty input", () => {
      expect(buildPayeeBreakdownFromTransactions([])).toEqual([]);
    });

    it("should aggregate by payee and sort by total volume", () => {
      const txs = [
        createMockTx({ payee: "Merchant A", direction: "debit", amount: 300 }),
        createMockTx({ payee: "Merchant B", direction: "credit", amount: 500 }),
        createMockTx({ payee: "Merchant A", direction: "debit", amount: 100 }),
      ];
      
      const result = buildPayeeBreakdownFromTransactions(txs, "INR");
      expect(result.length).toBe(2);
      
      expect(result[0].payee).toBe("Merchant B");
      expect(result[0].totalCredit).toBe(500);
      expect(result[0].totalDebit).toBe(0);
      expect(result[0].transactionCount).toBe(1);
      
      expect(result[1].payee).toBe("Merchant A");
      expect(result[1].totalCredit).toBe(0);
      expect(result[1].totalDebit).toBe(400);
      expect(result[1].transactionCount).toBe(2);
    });
  });

  describe("buildDocumentComparisonFromTransactions", () => {
    it("should handle empty input", () => {
      expect(buildDocumentComparisonFromTransactions([])).toEqual([]);
    });

    it("should group by document name and establish date range", () => {
      const txs = [
        createMockTx({ sourceFile: "docA.pdf", transactionDate: "2026-06-01", direction: "debit", amount: 100 }),
        createMockTx({ sourceFile: "docA.pdf", transactionDate: "2026-06-15", direction: "credit", amount: 300 }),
        createMockTx({ sourceFile: "docB.pdf", transactionDate: "2026-06-10", direction: "debit", amount: 50 }),
      ];
      
      const result = buildDocumentComparisonFromTransactions(txs, "INR");
      expect(result.length).toBe(2);
      
      const docA = result.find(d => d.fileName === "docA.pdf");
      const docB = result.find(d => d.fileName === "docB.pdf");
      
      expect(docA?.income).toBe(300);
      expect(docA?.expenses).toBe(100);
      expect(docA?.transactionCount).toBe(2);
      expect(docA?.dateRange).toBe("2026-06-01 to 2026-06-15");
      
      expect(docB?.income).toBe(0);
      expect(docB?.expenses).toBe(50);
      expect(docB?.transactionCount).toBe(1);
      expect(docB?.dateRange).toBe("2026-06-10");
    });
  });

  describe("healthScore", () => {
    it("should calculate correct health breakdown and score", () => {
      // savingsRate = 10%, recurringBillCount = 3, payeeConcentration = 0.5 (50%)
      const score = healthScore({
        savingsRate: 10,
        recurringBillCount: 3,
        payeeConcentration: 0.5,
      });
      
      expect(score.baseScore).toBe(50);
      expect(score.savingsRateContribution).toBe(10);
      expect(score.recurringBillPenalty).toBe(-6); // 3 * 2
      expect(score.payeeConcentrationPenalty).toBe(-10); // 0.5 * 20
      expect(score.total).toBe(44); // 50 + 10 - 6 - 10 = 44
    });

    it("should clamp values between 0 and 100", () => {
      const lowScore = healthScore({
        savingsRate: -100,
        recurringBillCount: 50,
        payeeConcentration: 1.0,
      });
      expect(lowScore.total).toBe(0);

      const highScore = healthScore({
        savingsRate: 100,
        recurringBillCount: 0,
        payeeConcentration: 0,
      });
      expect(highScore.total).toBe(80); // 50 + 30 - 0 - 0 = 80
    });
  });

  describe("predictedNextExpense", () => {
    it("should handle empty or single month data", () => {
      expect(predictedNextExpense([])).toEqual({ prediction: 0, variance: 0, confidence: "No Data" });
      
      const single: MonthlyPoint[] = [{ month: "Jun 2026", income: 1000, expenses: 500, net: 500, closingBalance: 500 }];
      expect(predictedNextExpense(single)).toEqual({ prediction: 500, variance: 0, confidence: "Low" });
    });

    it("should perform weighted prediction and output confidence", () => {
      // Month 1: weight 1, expense 1000
      // Month 2: weight 2, expense 1200
      // Month 3: weight 3, expense 1100
      const series: MonthlyPoint[] = [
        { month: "Apr 2026", income: 2000, expenses: 1000, net: 1000, closingBalance: null },
        { month: "May 2026", income: 2000, expenses: 1200, net: 800, closingBalance: null },
        { month: "Jun 2026", income: 2000, expenses: 1100, net: 900, closingBalance: null },
      ];
      
      const { prediction, confidence } = predictedNextExpense(series);
      
      // prediction = (1000 * 1 + 1200 * 2 + 1100 * 3) / (1 + 2 + 3)
      //            = (1000 + 2400 + 3300) / 6 = 6700 / 6 = 1116.666
      expect(prediction).toBeCloseTo(1116.67, 2);
      expect(confidence).toBe("High"); // very narrow spread
    });
  });
});
