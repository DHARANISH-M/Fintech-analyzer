import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";

import { TransactionRecord } from "@shared/api";
import { fetchTransactions, formatMoney } from "@/lib/finance-api";

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("all");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetchTransactions();
        setTransactions(response.transactions);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load transactions.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(transactions.map((transaction) => transaction.category)))],
    [transactions],
  );

  const filtered = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        search.trim() === "" ||
        `${transaction.description} ${transaction.category} ${transaction.sourceFile}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesDirection = direction === "all" || transaction.direction === direction;
      const matchesCategory = category === "all" || transaction.category === category;
      return matchesSearch && matchesDirection && matchesCategory;
    });
  }, [transactions, search, direction, category]);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* <section className="cursor-card p-8">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">SQL ledger</p>
        <h1 className="mt-2 text-3xl font-heading font-normal tracking-tight text-foreground">Transactions</h1>
        <p className="mt-2 text-sm leading-relaxed text-card-foreground font-light">
          Browse and filter extracted transaction records with custom categorizations and confidence ratings.
        </p>
      </section> */}

      {/* Filter panel */}
      <div className="grid gap-4 border border-sub-border bg-sub-card p-4 md:grid-cols-[1.6fr_0.7fr_0.7fr] rounded-lg shadow-sm">
        <label className="relative block">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search description, category, or source..."
            className="w-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary shadow-sm"
            style={{ borderRadius: "8px", height: "44px" }}
          />
        </label>
        
        <div className="relative">
          <select
            value={direction}
            onChange={(event) => setDirection(event.target.value)}
            className="w-full border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary appearance-none font-sans shadow-sm"
            style={{ borderRadius: "8px", height: "44px" }}
          >
            <option value="all">All directions</option>
            <option value="credit">Credit only</option>
            <option value="debit">Debit only</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="relative">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary appearance-none font-sans shadow-sm"
            style={{ borderRadius: "8px", height: "44px" }}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All categories" : item}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {isLoading && <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Loading transactions...</p>}
      {error && (
        <div className="border border-destructive/25 bg-destructive/5 px-6 py-4 text-xs font-bold text-destructive uppercase tracking-wide rounded-md">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="cursor-card overflow-hidden">
          <div className="border-b border-border bg-sub-card px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {filtered.length} transaction{filtered.length === 1 ? "" : "s"} matched
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sub-card/60 text-muted-foreground text-[10px] font-bold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Source document</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-sub-card/60 transition-colors align-middle">
                    <td className="px-5 py-4 text-xs font-mono text-muted-foreground whitespace-nowrap">{transaction.transactionDate}</td>
                    <td className="px-5 py-4 font-semibold text-foreground text-sm">{transaction.description}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{transaction.category}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground max-w-[150px] truncate">{transaction.sourceFile}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground font-mono whitespace-nowrap">{transaction.extractionConfidence.toFixed(0)}%</td>
                    <td className={`px-5 py-4 text-right font-mono text-xs font-semibold whitespace-nowrap ${transaction.direction === "credit" ? "text-success" : "text-destructive"}`}>
                      {transaction.direction === "credit" ? "+" : "-"}{formatMoney(transaction.amount)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {transaction.balance === null ? "-" : formatMoney(transaction.balance)}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-xs uppercase font-bold tracking-wider text-muted-foreground">
                      No extracted transactions match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
