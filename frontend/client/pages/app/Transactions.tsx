import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { TransactionRecord } from "@shared/api";
import { fetchTransactions, formatMoney } from "@/lib/finance-api";

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("all");
  const [category, setCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, direction, category]);

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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage]);

  return (
    <div className="h-[calc(100vh-160px)] md:h-[calc(100vh-170px)] flex flex-col overflow-hidden font-sans">
      {/* Filter panel */}
      <div className="flex-shrink-0 pb-4">
        <div className="grid gap-4 border border-sub-border bg-sub-card p-4 md:grid-cols-[1.6fr_0.7fr_0.7fr] rounded-lg shadow-sm">
          <label className="relative block w-full" style={{ minHeight: "44px", overflow: "visible", boxSizing: "border-box" }}>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search description, category, or source..."
              className="w-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary shadow-sm"
              style={{
                borderRadius: "8px",
                height: "44px",
                minHeight: "44px",
                lineHeight: "20px",
                paddingTop: "11px",
                paddingBottom: "11px",
                boxSizing: "border-box",
                overflow: "hidden"
              }}
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
      </div>

      {isLoading && <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Loading transactions...</p>}
      {error && (
        <div className="border border-destructive/25 bg-destructive/5 px-6 py-4 text-xs font-bold text-destructive uppercase tracking-wide rounded-md">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="cursor-card flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="border-b border-border bg-sub-card px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex-shrink-0">
            {filtered.length} transaction{filtered.length === 1 ? "" : "s"} matched
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
            <table className="w-full text-left text-sm relative">
              <thead className="bg-sub-card text-muted-foreground text-[10px] font-bold uppercase tracking-wider border-b border-border sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <tr>
                  <th className="px-5 py-3 bg-sub-card">Date</th>
                  <th className="px-5 py-3 bg-sub-card">Description</th>
                  <th className="px-5 py-3 bg-sub-card">Category</th>
                  <th className="px-5 py-3 bg-sub-card">Source document</th>
                  <th className="px-5 py-3 bg-sub-card">Confidence</th>
                  <th className="px-5 py-3 bg-sub-card text-right">Amount</th>
                  <th className="px-5 py-3 bg-sub-card text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedTransactions.map((transaction) => (
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
          {/* Pagination Footer */}
          {filtered.length > 0 && (
            <div className="border-t border-border bg-sub-card/30 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
              <div className="text-xs text-muted-foreground font-sans">
                Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span>–
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * itemsPerPage, filtered.length)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{filtered.length}</span> transaction{filtered.length === 1 ? "" : "s"}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-md bg-card hover:bg-sub-card disabled:opacity-50 disabled:pointer-events-none transition-colors text-foreground shadow-sm h-8"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 5;
                    if (totalPages <= maxVisiblePages) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);

                      if (start > 2) {
                        pages.push("ellipsis-start");
                      }
                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }
                      if (end < totalPages - 1) {
                        pages.push("ellipsis-end");
                      }
                      pages.push(totalPages);
                    }

                    return pages.map((page, idx) => {
                      if (typeof page === "string") {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-muted-foreground select-none">
                            ...
                          </span>
                        );
                      }
                      const isActive = page === currentPage;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`inline-flex items-center justify-center min-w-[32px] h-8 px-2.5 text-xs font-medium border rounded-md transition-colors shadow-sm ${
                            isActive
                              ? "bg-primary text-white border-primary hover:bg-primary/90"
                              : "border-border bg-card hover:bg-sub-card text-foreground"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    });
                  })()}
                </div>

                <span className="sm:hidden text-xs text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-md bg-card hover:bg-sub-card disabled:opacity-50 disabled:pointer-events-none transition-colors text-foreground shadow-sm h-8"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
