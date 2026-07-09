import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

export interface ParsedTransaction {
  txn_date: string; // YYYY-MM-DD
  description: string;
  txn_type: 'DEBIT' | 'CREDIT';
  amount: number;
  balance: number | null;
  payee: string;
  category: string;
}

export interface ParsedStatement {
  bank_name: string;
  account_number_last4: string;
  period_from: string | null; // YYYY-MM-DD
  period_to: string | null; // YYYY-MM-DD
  transactions: ParsedTransaction[];
}

// Predefined category matchers matching frontend configuration
const CATEGORY_MATCHERS = [
  { pattern: /bescom|electricity|power/i, payee: "BESCOM Electricity", category: "Rent & Utilities", defaultType: 'DEBIT' as const },
  { pattern: /rent|utilities|house rent|home loan|emi/i, payee: "HDFC Home Loan", category: "Rent & Utilities", defaultType: 'DEBIT' as const },
  { pattern: /zomato/i, payee: "Zomato", category: "Food & Dining", defaultType: 'DEBIT' as const },
  { pattern: /swiggy/i, payee: "Swiggy", category: "Food & Dining", defaultType: 'DEBIT' as const },
  { pattern: /starbucks/i, payee: "Starbucks Coffee", category: "Food & Dining", defaultType: 'DEBIT' as const },
  { pattern: /netflix/i, payee: "Netflix India", category: "Software Subs", defaultType: 'DEBIT' as const },
  { pattern: /spotify/i, payee: "Spotify Premium", category: "Software Subs", defaultType: 'DEBIT' as const },
  { pattern: /github|copilot/i, payee: "GitHub", category: "Software Subs", defaultType: 'DEBIT' as const },
  { pattern: /uber/i, payee: "Uber India", category: "Travel", defaultType: 'DEBIT' as const },
  { pattern: /ola/i, payee: "Ola Cabs", category: "Travel", defaultType: 'DEBIT' as const },
  { pattern: /amazon|amzn/i, payee: "Amazon", category: "Shopping", defaultType: 'DEBIT' as const },
  { pattern: /flipkart/i, payee: "Flipkart", category: "Shopping", defaultType: 'DEBIT' as const },
  { pattern: /myntra/i, payee: "Myntra Shopping", category: "Shopping", defaultType: 'DEBIT' as const },
  { pattern: /apollo|pharmacy|meds/i, payee: "Apollo Pharmacy", category: "Health", defaultType: 'DEBIT' as const },
  { pattern: /life|insurance|hdfc life/i, payee: "HDFC Life", category: "Financial Obligations", defaultType: 'DEBIT' as const },
  { pattern: /salary|co salary|direct deposit/i, payee: "Company Salary", category: "Income", defaultType: 'CREDIT' as const },
  { pattern: /interest|sb interest|saving interest/i, payee: "Quarterly Interest", category: "Income", defaultType: 'CREDIT' as const },
  { pattern: /transfer.*rahul|upi.*rahul|friend/i, payee: "Friend Transfer", category: "Credit", defaultType: 'CREDIT' as const },
];

/**
 * Helper to parse a date string into YYYY-MM-DD
 */
function parseDate(dateStr: string): string | null {
  try {
    const cleanStr = dateStr.trim().replace(/[\/\s]/g, '-');
    const parts = cleanStr.split('-');
    
    // Check if it is DD-MM-YYYY or DD-MMM-YYYY
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let monthStr = parts[1];
      let yearStr = parts[2];
      
      // Handle YYYY-MM-DD format
      if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(d)) {
          return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }

      let month = parseInt(monthStr, 10) - 1; // 0-indexed
      if (isNaN(month)) {
        // Month is a name (e.g. May, APR, APR)
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        month = monthNames.indexOf(monthStr.toLowerCase().slice(0, 3));
      }

      let year = parseInt(yearStr, 10);
      if (yearStr.length === 2) {
        year += 2000; // Assume 21st century
      }

      if (!isNaN(day) && month >= 0 && month <= 11 && !isNaN(year)) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  } catch (e) {
    console.error('Failed parsing date:', dateStr, e);
  }
  return null;
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  return result.text || '';
}

/**
 * Parse transactions and statement info from raw text
 */
export function parseStatementAndTransactions(text: string, filename: string): ParsedStatement {
  const lines = text.split('\n');
  const transactions: ParsedTransaction[] = [];
  
  let bank_name = 'SBI'; // Default fallback
  let account_number_last4 = '0000';
  let period_from: string | null = null;
  let period_to: string | null = null;

  // Try to find Bank Name in the text
  if (/hdfc/i.test(text)) {
    bank_name = 'HDFC Bank';
  } else if (/icici/i.test(text)) {
    bank_name = 'ICICI Bank';
  } else if (/axis/i.test(text)) {
    bank_name = 'Axis Bank';
  } else if (/state bank|sbi/i.test(text)) {
    bank_name = 'State Bank of India';
  } else if (/citi/i.test(text)) {
    bank_name = 'Citibank';
  } else {
    // extract from filename
    if (filename.toLowerCase().includes('sbi')) bank_name = 'State Bank of India';
    else if (filename.toLowerCase().includes('hdfc')) bank_name = 'HDFC Bank';
    else if (filename.toLowerCase().includes('icici')) bank_name = 'ICICI Bank';
    else if (filename.toLowerCase().includes('axis')) bank_name = 'Axis Bank';
  }

  // Try to find Account Number
  const accMatch = text.match(/(?:account\s*no|a\/c\s*no|account\s*number|acc\s*no)[\s:]*([0-9Xx*]+)/i);
  if (accMatch && accMatch[1]) {
    const rawAcc = accMatch[1].replace(/[\sXx*]/g, '');
    if (rawAcc.length >= 4) {
      account_number_last4 = rawAcc.slice(-4);
    }
  } else {
    // If not found, check random 4 digits in text or assign a default
    const digits = text.match(/\b\d{10,18}\b/);
    if (digits) {
      account_number_last4 = digits[0].slice(-4);
    }
  }

  // Regular expression to match standard dates: DD/MM/YYYY, DD-MM-YYYY, DD-MMM-YYYY, DD-MMM-YY, YYYY-MM-DD
  const dateRegex = /\b(\d{1,2}[\/\-\s](?:[A-Za-z]{3}|\d{1,2})[\/\-\s]\d{2,4})|(\d{4}[\/\-\s]\d{1,2}[\/\-\s]\d{1,2})\b/g;

  // Parse lines for transactions
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Reset date regex index
    dateRegex.lastIndex = 0;
    const dateMatch = dateRegex.exec(line);

    if (dateMatch) {
      const matchedDateStr = dateMatch[0];
      const parsedDate = parseDate(matchedDateStr);

      if (parsedDate) {
        // Remove the matched date from line to avoid parsing it as amounts
        let remainingLine = line.replace(matchedDateStr, ' ').trim();

        // Clean up other dates if present (e.g. posted date)
        remainingLine = remainingLine.replace(dateRegex, ' ');

        // Clean commas from numbers in the line so they parse correctly
        const numberLine = remainingLine.replace(/,/g, '');

        // Match all numbers (decimal or integer)
        const numberMatches = numberLine.match(/\b\d+\.\d{2}\b/g) || numberLine.match(/\b\d+\b/g);

        if (numberMatches && numberMatches.length > 0) {
          // Parse all numbers
          const parsedNumbers = numberMatches.map(n => parseFloat(n));

          // Heuristic:
          // If 1 number: amount = number[0], balance = null
          // If 2 numbers: amount = number[0], balance = number[1]
          // If 3 numbers: we check if one is 0.00 (which could be the empty debit/credit column).
          // Let's filter out numbers that equal the year (e.g. 2026) or day to be safe.
          const cleanNumbers = parsedNumbers.filter(val => {
            const yearStr = parsedDate.split('-')[0];
            return val !== parseInt(yearStr, 10); // exclude matching year values
          });

          if (cleanNumbers.length > 0) {
            let amount = cleanNumbers[0];
            let balance: number | null = null;

            if (cleanNumbers.length >= 2) {
              // The last number is usually the balance
              balance = cleanNumbers[cleanNumbers.length - 1];
              // If there are multiple numbers, the amount is the first non-zero number (excluding balance)
              const amountCandidates = cleanNumbers.slice(0, -1).filter(v => v > 0);
              if (amountCandidates.length > 0) {
                amount = amountCandidates[0];
              }
            }

            // Exclude extremely small amounts that are probably table indexes
            if (amount <= 0.1) continue;

            // Determine description by stripping the matched numbers from remainingLine
            let description = remainingLine;
            for (const numStr of numberMatches) {
              description = description.replace(numStr, ' ');
            }
            // Clean up description formatting
            description = description.replace(/\s+/g, ' ').replace(/[\-\*\:]/g, '').trim();

            if (!description || description.length < 3) {
              description = `Transaction on ${parsedDate}`;
            }

            // Determine DEBIT vs CREDIT type
            let txn_type: 'DEBIT' | 'CREDIT' = 'DEBIT'; // Default
            if (/\b(?:cr|credit|deposit|dep|int|salary|interest|refund|\+)\b/i.test(line)) {
              txn_type = 'CREDIT';
            } else if (/\b(?:dr|debit|withdraw|wdl|\-)\b/i.test(line)) {
              txn_type = 'DEBIT';
            } else {
              // Fallback to keyword match
              const lowercaseDesc = description.toLowerCase();
              if (lowercaseDesc.includes('salary') || lowercaseDesc.includes('refund') || lowercaseDesc.includes('interest')) {
                txn_type = 'CREDIT';
              }
            }

            // Match payee and category
            let payee = 'Unrecognized Merchant';
            let category = 'Uncategorized';

            const match = CATEGORY_MATCHERS.find(m => m.pattern.test(description));
            if (match) {
              payee = match.payee;
              category = match.category;
              txn_type = match.defaultType;
            } else {
              // Dynamic assignment
              if (txn_type === 'CREDIT') {
                payee = 'Transfer UPI In';
                category = 'Credit';
              } else {
                payee = 'Unrecognized POS Merchant';
                category = 'Uncategorized';
              }
            }

            transactions.push({
              txn_date: parsedDate,
              description,
              txn_type,
              amount,
              balance,
              payee,
              category
            });
          }
        }
      }
    }
  }

  // Sort transactions chronologically
  transactions.sort((a, b) => a.txn_date.localeCompare(b.txn_date));

  // Determine period_from and period_to from transactions if available
  if (transactions.length > 0) {
    period_from = transactions[0].txn_date;
    period_to = transactions[transactions.length - 1].txn_date;
  }

  return {
    bank_name,
    account_number_last4,
    period_from,
    period_to,
    transactions
  };
}
