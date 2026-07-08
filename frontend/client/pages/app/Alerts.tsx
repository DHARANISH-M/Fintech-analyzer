import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { AlertsResponse } from "@shared/api";
import { fetchAlerts } from "@/lib/finance-api";
import Loader from "@/components/Loader";

const severityTone: Record<string, string> = {
  high: "border-destructive/25 bg-destructive/5 text-destructive",
  medium: "border-border bg-sub-card text-card-foreground",
  low: "border-border bg-sub-card text-foreground",
};

export default function Alerts() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        setData(await fetchAlerts());
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load alerts.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* <section className="cursor-card p-8">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">SYSTEM REVIEW</p>
        <h1 className="mt-2 text-3xl font-heading font-normal tracking-tight text-foreground">Alerts</h1>
        <p className="mt-2 text-sm leading-relaxed text-card-foreground font-light">
          Anomalies, expense spikes, and review items derived automatically from the extracted transactions.
        </p>
      </section> */}

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader size="md" />
          <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mt-4">Loading alerts...</p>
        </div>
      )}
      {error && (
        <div className="border border-destructive/25 bg-destructive/5 px-6 py-4 text-xs font-bold text-destructive uppercase tracking-wide rounded-md">
          {error}
        </div>
      )}

      {!isLoading && !error && data && (
        <div className="space-y-4">
          {data.alerts.length === 0 && (
            <div className="border border-success/25 bg-success/5 p-6 text-success rounded-lg">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="h-5 w-5" />
                No alerts detected from the current transaction sets.
              </div>
            </div>
          )}

          {data.alerts.map((alert) => (
            <div key={alert.id} className={`border p-6 transition-all duration-200 rounded-lg ${severityTone[alert.severity] || severityTone.low}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-5 w-5 opacity-90" />
                    <h2 className="font-heading text-base font-normal tracking-normal text-foreground">{alert.title}</h2>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed max-w-3xl font-light">{alert.reason}</p>
                  <div className="pt-2">
                    <span className="inline-block border border-border bg-sub-card px-3 py-1 text-[10px] font-semibold rounded-md shadow-sm" style={{ borderRadius: "6px" }}>
                      Action: {alert.action}
                    </span>
                  </div>
                </div>
                <span className="border border-current/20 bg-card/50 px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold rounded-full">
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
