import { Router, Response, NextFunction } from 'express';
import { query } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { extractTextFromPdf, parseStatementAndTransactions } from '../utils/pdf-parser';

const router = Router();

// Category and payee matching logic reused for dynamic derivation
const CATEGORY_MATCHERS = [
  { pattern: /bescom|electricity|power/i, payee: "BESCOM Electricity", category: "Rent & Utilities" },
  { pattern: /rent|utilities|house rent|home loan|emi/i, payee: "HDFC Home Loan", category: "Rent & Utilities" },
  { pattern: /zomato/i, payee: "Zomato", category: "Food & Dining" },
  { pattern: /swiggy/i, payee: "Swiggy", category: "Food & Dining" },
  { pattern: /starbucks/i, payee: "Starbucks Coffee", category: "Food & Dining" },
  { pattern: /netflix/i, payee: "Netflix India", category: "Software Subs" },
  { pattern: /spotify/i, payee: "Spotify Premium", category: "Software Subs" },
  { pattern: /github|copilot/i, payee: "GitHub", category: "Software Subs" },
  { pattern: /uber/i, payee: "Uber India", category: "Travel" },
  { pattern: /ola/i, payee: "Ola Cabs", category: "Travel" },
  { pattern: /amazon|amzn/i, payee: "Amazon", category: "Shopping" },
  { pattern: /flipkart/i, payee: "Flipkart", category: "Shopping" },
  { pattern: /myntra/i, payee: "Myntra Shopping", category: "Shopping" },
  { pattern: /apollo|pharmacy|meds/i, payee: "Apollo Pharmacy", category: "Health" },
  { pattern: /life|insurance|hdfc life/i, payee: "HDFC Life", category: "Financial Obligations" },
  { pattern: /salary|co salary|direct deposit/i, payee: "Company Salary", category: "Income" },
  { pattern: /interest|sb interest|saving interest/i, payee: "Quarterly Interest", category: "Income" },
  { pattern: /transfer.*rahul|upi.*rahul|friend/i, payee: "Friend Transfer", category: "Credit" },
];

function deriveTransactionDetails(description: string, txn_type: string) {
  let payee = 'Unrecognized Merchant';
  let category = 'Uncategorized';

  const match = CATEGORY_MATCHERS.find(m => m.pattern.test(description));
  if (match) {
    payee = match.payee;
    category = match.category;
  } else {
    if (txn_type === 'CREDIT') {
      payee = 'Transfer UPI In';
      category = 'Credit';
    } else {
      payee = 'Unrecognized POS Merchant';
      category = 'Uncategorized';
    }
  }

  return { payee, category };
}

// Helpers for calculations

function buildMetrics(transactions: any[], documents: any[]) {
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

function buildMonthlySeries(transactions: any[]) {
  const grouped = new Map<string, any>();
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

function buildCategoryBreakdown(transactions: any[], direction: "credit" | "debit") {
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

function buildRecurringTransactions(transactions: any[]) {
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

function buildPayeeBreakdown(transactions: any[]) {
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

function buildPayeeLedger(transactions: any[]) {
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

function buildAlerts(transactions: any[]) {
  const alerts: any[] = [];
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

  const duplicates = new Map<string, any[]>();
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

function formatDate(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === 'string') {
    if (val.includes('T')) {
      return val.split('T')[0];
    }
    return val;
  }
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function formatISO(val: any): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return new Date().toISOString();
}

// Common function to retrieve active data for calculations
async function getActiveData(userId: string) {
  const docsResult = await query(
    'SELECT * FROM statements WHERE user_id = $1 ORDER BY uploaded_at DESC',
    [userId]
  );

  const txsResult = await query(
    `SELECT t.*, s.filename as source_file 
     FROM transactions t 
     JOIN statements s ON t.statement_id = s.id 
     WHERE t.user_id = $1 
     ORDER BY t.txn_date DESC, t.created_at DESC`,
    [userId]
  );

  const transactions = txsResult.rows.map(row => {
    const direction = row.txn_type.toLowerCase() as 'credit' | 'debit';
    const { payee, category } = deriveTransactionDetails(row.description, row.txn_type);
    return {
      id: row.id,
      documentId: row.statement_id,
      sourceFile: row.source_file,
      transactionDate: formatDate(row.txn_date) || '',
      postedDate: formatDate(row.txn_date) || '',
      description: row.description,
      payee,
      reference: 'TXN' + row.id.slice(0, 8).toUpperCase(),
      category,
      direction,
      amount: parseFloat(row.amount),
      balance: row.balance ? parseFloat(row.balance) : null,
      currencyCode: 'INR',
      extractionConfidence: 99,
      createdAt: formatISO(row.created_at)
    };
  });

  const documents = docsResult.rows.map(row => {
    const count = transactions.filter(t => t.documentId === row.id).length;
    return {
      id: row.id,
      userId: row.user_id,
      fileName: row.filename,
      fileType: 'application/pdf',
      fileSize: 452812, // placeholder
      s3Key: row.id,
      publicUrl: '#',
      uploadedAt: formatISO(row.uploaded_at),
      extractionStatus: row.status,
      extractionError: row.status === 'failed' ? 'Failed to parse' : null,
      statementStartDate: formatDate(row.period_from),
      statementEndDate: formatDate(row.period_to),
      transactionCount: count
    };
  });

  return { transactions, documents };
}

// Upload Endpoint
router.post('/users/upload', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { fileName, fileSize, fileContentBase64 } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'User is not authenticated.' });
    return;
  }

  if (!fileContentBase64) {
    res.status(400).json({ message: 'No file content provided.' });
    return;
  }

  try {
    // 1. Decode base64 PDF to buffer
    const pdfBuffer = Buffer.from(fileContentBase64, 'base64');

    // 2. Insert statement record in DB as processing
    const stmtResult = await query(
      `INSERT INTO statements (user_id, filename, status) 
       VALUES ($1, $2, 'processing') 
       RETURNING *`,
      [userId, fileName]
    );
    const newStatement = stmtResult.rows[0];

    try {
      // 3. Extract text
      const pdfText = await extractTextFromPdf(pdfBuffer);

      // 4. Parse statement and transactions
      const parsed = parseStatementAndTransactions(pdfText, fileName);

      // 5. Insert transaction records
      for (const tx of parsed.transactions) {
        await query(
          `INSERT INTO transactions (statement_id, user_id, txn_date, description, txn_type, amount, balance)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            newStatement.id,
            userId,
            tx.txn_date,
            tx.description,
            tx.txn_type,
            tx.amount,
            tx.balance
          ]
        );
      }

      // 6. Update statement status to completed
      const updatedStmtResult = await query(
        `UPDATE statements 
         SET status = 'completed', bank_name = $1, account_number_last4 = $2, period_from = $3, period_to = $4, raw_extraction = $5
         WHERE id = $6 
         RETURNING *`,
        [
          parsed.bank_name,
          parsed.account_number_last4,
          parsed.period_from,
          parsed.period_to,
          JSON.stringify(parsed),
          newStatement.id
        ]
      );

      const finalStatement = updatedStmtResult.rows[0];

      res.status(200).json({
        key: finalStatement.id,
        publicUrl: '#',
        document: {
          id: finalStatement.id,
          userId: finalStatement.user_id,
          fileName: finalStatement.filename,
          fileType: 'application/pdf',
          fileSize: fileSize || 1024,
          s3Key: finalStatement.id,
          publicUrl: '#',
          uploadedAt: formatISO(finalStatement.uploaded_at),
          extractionStatus: finalStatement.status,
          extractionError: null,
          statementStartDate: formatDate(finalStatement.period_from),
          statementEndDate: formatDate(finalStatement.period_to),
          transactionCount: parsed.transactions.length
        }
      });

    } catch (parseError) {
      console.error('Failed to parse statement PDF:', parseError);
      
      // Update status to failed
      await query(
        `UPDATE statements SET status = 'failed' WHERE id = $1`,
        [newStatement.id]
      );

      res.status(500).json({ message: 'Failed to extract text or parse transactions from PDF.' });
    }

  } catch (error) {
    console.error('Error uploading statement:', error);
    res.status(500).json({ message: 'Internal server error during statement upload.' });
  }
});

// Fetch statements
router.get('/statements', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { documents } = await getActiveData(userId);
    res.json({ documents });
  } catch (error) {
    console.error('Error fetching statements:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Fetch transactions
router.get('/transactions', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { transactions } = await getActiveData(userId);
    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Delete statement
router.delete('/statements/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const statementId = req.params.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    // Delete statement (will cascade delete transactions because of ON DELETE CASCADE)
    await query(
      'DELETE FROM statements WHERE id = $1 AND user_id = $2',
      [statementId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting statement:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Fetch Dashboard Metrics & Aggregations
router.get('/dashboard', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { transactions, documents } = await getActiveData(userId);

    const metrics = buildMetrics(transactions, documents);
    const monthlySeries = buildMonthlySeries(transactions);
    const categoryBreakdown = buildCategoryBreakdown(transactions, "debit");
    const topPayees = buildPayeeBreakdown(transactions);
    const payeeLedger = buildPayeeLedger(transactions);
    const recentTransactions = transactions.slice(0, 8);
    
    // Map upcoming recurring items dynamically
    const upcomingRecurring = buildRecurringTransactions(transactions)
      .slice(0, 5)
      .map((item, index) => ({
        id: 'REC' + index,
        documentId: '0',
        sourceFile: item.description,
        transactionDate: item.lastSeenAt,
        postedDate: null,
        description: item.description,
        payee: item.description,
        reference: null,
        category: item.category,
        direction: "debit" as const,
        amount: item.averageAmount,
        balance: null,
        currencyCode: "INR",
        extractionConfidence: 100,
        createdAt: new Date(item.lastSeenAt).toISOString(),
      }));

    res.json({
      metrics,
      monthlySeries,
      categoryBreakdown,
      topPayees: topPayees.map((tp) => ({
        payee: tp.payee,
        debit: tp.debit,
        credit: tp.credit,
        total: tp.total,
        net: tp.net,
        transactions: tp.transactions,
        lastPaidAt: tp.lastPaidAt
      })),
      payeeLedger,
      recentTransactions,
      upcomingRecurring
    });
  } catch (error) {
    console.error('Error loading dashboard analytics:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Fetch Analytics Page Aggregations
router.get('/analytics', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { transactions, documents } = await getActiveData(userId);

    const metrics = buildMetrics(transactions, documents);
    const monthlySeries = buildMonthlySeries(transactions);
    const expenseCategories = buildCategoryBreakdown(transactions, "debit");
    const incomeCategories = buildCategoryBreakdown(transactions, "credit");
    const recurringTransactions = buildRecurringTransactions(transactions).slice(0, 10);
    const payeeBreakdown = buildPayeeBreakdown(transactions);
    
    const documentComparison = documents.map((doc) => {
      const docTxs = transactions.filter((t) => t.documentId === doc.id);
      return {
        fileName: doc.fileName,
        income: docTxs.filter((t) => t.direction === "credit").reduce((sum, t) => sum + t.amount, 0),
        expenses: docTxs.filter((t) => t.direction === "debit").reduce((sum, t) => sum + t.amount, 0),
        transactionCount: docTxs.length,
      };
    });

    res.json({
      metrics,
      monthlySeries,
      expenseCategories,
      incomeCategories,
      recurringTransactions,
      payeeBreakdown,
      documentComparison
    });
  } catch (error) {
    console.error('Error fetching detailed analytics:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Fetch Alerts
router.get('/alerts', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { transactions } = await getActiveData(userId);
    res.json({
      alerts: buildAlerts(transactions)
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
