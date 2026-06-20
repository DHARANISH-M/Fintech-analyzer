import React from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 ml-64 bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
