import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Cpu, Download, Shield, TrendingUp } from "lucide-react";

export default function Landing() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-card-foreground overflow-x-hidden font-sans">
      {/* 1. Header (Cursor style) */}
      <header className="fixed top-0 left-0 w-full h-[64px] bg-background text-foreground z-50 flex items-center justify-between px-6 border-b border-border">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <Link to="/enhanced" className="flex items-center gap-2 text-foreground hover:opacity-85 transition-opacity">
            <span className="w-2.5 h-2.5 bg-primary rounded-full" />
            <span className="font-heading text-lg font-normal tracking-normal text-foreground">LedgerLens</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link 
              to="/enhanced/login" 
              className="animated-login-btn"
            >
              <span>Sign in</span>
            </Link>
            <Link
              to="/enhanced/signup"
              className="get-started-btn"
            >
              Get started
              <div className="icon">
                <svg height={24} width={24} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Sub-Nav Bar (Cursor secondary style) */}
      <div className="fixed top-[64px] left-0 w-full h-[56px] bg-background border-b border-border z-40 flex items-center justify-between px-6">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          {/* <Link to="/enhanced" className="font-heading text-sm font-normal text-foreground tracking-normal">
            Statement analyzer
          </Link> */}
          <div className="flex items-center gap-6">
            {/* <Link 
              to="/enhanced/login" 
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Live Demo
            </Link> */}
          </div>
        </div>
      </div>

      {/* HERO SECTION (80px section rhythm) */}
      <section className="mt-[120px] pt-20 pb-24 px-6 bg-background flex flex-col items-center text-center">
        <div className="max-w-[900px] w-full space-y-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">LOCAL FIRST • RAM SANDBOX</p>
          <h1 className="text-5xl md:text-[72px] font-heading font-normal text-foreground tracking-tight leading-[1.1]">
            The thinking partner for financial statements.
          </h1>
          <p className="text-base md:text-[18px] text-card-foreground font-light leading-relaxed max-w-xl mx-auto">
            LedgerLens parses, normalizes, and reveals bank insights completely locally inside your browser sandbox. Safe from remote servers.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <Link
              to="/enhanced/signup"
              className="cursor-btn-download"
            >
              Start Free Workspace
            </Link>
            <Link
              to="/enhanced/login"
              className="cursor-text-link"
            >
              Sign in to demo workspace →
            </Link>
          </div>
        </div>

        {/* IDE Mockup Card (White card, no padding, mult-pane layout inside) */}
        <div className="mt-20 max-w-[960px] w-full bg-card border border-border rounded-lg shadow-none overflow-hidden text-left">
          {/* Top IDE Tab Bar */}
          <div className="flex items-center justify-between border-b border-border bg-sub-card px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#dfa88f] rounded-full" />
              <span className="w-2.5 h-2.5 bg-[#9fbbe0] rounded-full" />
              <span className="w-2.5 h-2.5 bg-[#9fc9a2] rounded-full" />
            </div>
            <span className="text-[11px] font-mono tracking-wide text-muted-foreground">ledgerlens_editor_sandbox</span>
            <div className="w-10" />
          </div>

          <div className="grid md:grid-cols-[200px_1fr_260px] min-h-[420px] font-mono text-xs">
            {/* IDE Sidebar (Pane Soft) */}
            <div className="bg-sub-card border-r border-border p-4 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workspace Files</p>
              <div className="space-y-2 text-card-foreground">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <span className="text-primary">📄</span> May24_Statement.pdf
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <span>📄</span> Parser.ts
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <span>📄</span> Schema.json
                </div>
              </div>
            </div>

            {/* Main Code Editor */}
            <div className="p-6 bg-card space-y-4 overflow-x-auto text-foreground">
              <div className="border-b border-sub-border pb-2 text-[10px] uppercase font-bold text-muted-foreground">
                Parsed Output JSON
              </div>
              <pre className="text-[11px] leading-relaxed font-mono text-foreground">
{`{
  "statement": "SBI_May24_Statement.pdf",
  "meta": {
    "total_credit": 92000.00,
    "total_debit": 20720.00,
    "net_movement": 71280.00
  },
  "transactions": [
    {
      "date": "2026-06-18",
      "payee": "HDFC Term Loan",
      "category": "Rent & Utilities",
      "amount": -15400.00
    },
    {
      "date": "2026-06-16",
      "payee": "Zomato Food",
      "category": "Dining Out",
      "amount": -480.00
    }
  ]
}`}
              </pre>
            </div>

            {/* AI Agent Sidebar Pane */}
            <div className="bg-sub-card border-l border-border p-4 flex flex-col justify-between">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">AI Agent Timeline</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="timeline-pill-thinking">Thinking</span>
                    <span className="text-[10px] text-muted-foreground font-mono">12ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="timeline-pill-read">Reading</span>
                    <span className="text-[10px] text-muted-foreground font-mono">94ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="timeline-pill-done">Done</span>
                    <span className="text-[10px] text-muted-foreground font-mono">22 items</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 text-[11px] leading-normal text-card-foreground font-sans">
                  "Found 22 transactions. UPI normalization applied to 14 description tags successfully."
                </div>
              </div>

              <div className="h-1 bg-gradient-to-r from-[#dfa88f] via-[#9fbbe0] to-[#c0a8dd]" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARD GRID SECTION (80px section rhythm, white cards on cream canvas) */}
      <section className="py-20 px-6 bg-background border-t border-border flex flex-col items-center">
        <div className="max-w-[1200px] w-full space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">DEVELOPER DIALECT</p>
            <h2 className="text-3xl md:text-4xl font-heading font-normal text-foreground leading-tight">
              Designed for visual clarity and local speed.
            </h2>
            <p className="text-sm text-card-foreground font-light leading-relaxed">
              Every core utility is built to keep your financial metrics structured and completely confidential inside client sandbox memory.
            </p>
          </div>

          {/* 3-column card grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card p-8 border border-border rounded-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-sub-card border border-sub-border rounded flex items-center justify-center text-foreground">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-normal text-foreground">Local browser sandbox</h3>
                <p className="text-card-foreground text-xs leading-relaxed font-light">
                  Your bank statements never touch a remote server. All parsing, categorization, and ledger indexing executes in client device RAM.
                </p>
              </div>
              <Link to="/enhanced/signup" className="cursor-text-link text-xs pt-6">
                Create workspace →
              </Link>
            </div>

            <div className="bg-card p-8 border border-border rounded-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-sub-card border border-sub-border rounded flex items-center justify-center text-foreground">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-normal text-foreground">UPI normalization</h3>
                <p className="text-card-foreground text-xs leading-relaxed font-light">
                  Intelligently cleans complex bank descriptions, UPI references, and POS tags into clean, human-readable merchant lists.
                </p>
              </div>
              <Link to="/enhanced/login" className="cursor-text-link text-xs pt-6">
                Try sandbox demo →
              </Link>
            </div>

            <div className="bg-card p-8 border border-border rounded-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-sub-card border border-sub-border rounded flex items-center justify-center text-foreground">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-normal text-foreground">Excel exporter</h3>
                <p className="text-card-foreground text-xs leading-relaxed font-light">
                  Instantly download beautifully formatted Excel worksheets containing clean transaction lists, payee ledgers, and net flows.
                </p>
              </div>
              <Link to="/enhanced/signup" className="cursor-text-link text-xs pt-6">
                Sign up now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER (Cursor cream layout style) */}
      <footer className="bg-background text-muted-foreground pt-20 pb-12 px-6 border-t border-border">
        <div className="max-w-[1200px] mx-auto text-xs leading-relaxed space-y-12 font-light">
          {/* Dense link grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-b border-border pb-10">
            <div className="space-y-3">
              <p className="font-semibold text-foreground uppercase tracking-[0.08em] text-[10px]">Product Pages</p>
              <ul className="space-y-2 font-medium">
                <li><Link to="/enhanced/dashboard" className="hover:text-primary transition-colors">Analyzer overview</Link></li>
                <li><Link to="/enhanced/documents" className="hover:text-primary transition-colors">Local sandbox</Link></li>
                <li><Link to="/enhanced/analytics" className="hover:text-primary transition-colors">Insights panel</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-foreground uppercase tracking-[0.08em] text-[10px]">Security & Tech</p>
              <ul className="space-y-2 font-medium">
                <li><span className="hover:text-primary cursor-pointer">Client-side parser</span></li>
                <li><span className="hover:text-primary cursor-pointer">Local encryption</span></li>
                <li><span className="hover:text-primary cursor-pointer">SQL processing</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-foreground uppercase tracking-[0.08em] text-[10px]">Terms & Privacy</p>
              <ul className="space-y-2 font-medium">
                <li><span className="hover:text-primary cursor-pointer">Privacy guidelines</span></li>
                <li><span className="hover:text-primary cursor-pointer">Workspace agreement</span></li>
                <li><span className="hover:text-primary cursor-pointer">Cookie settings</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-foreground uppercase tracking-[0.08em] text-[10px]">About LedgerLens</p>
              <ul className="space-y-2 font-medium">
                <li><span className="hover:text-primary cursor-pointer">Our research</span></li>
                <li><span className="hover:text-primary cursor-pointer">Feedback & logs</span></li>
                <li><span className="hover:text-primary cursor-pointer">Contact support</span></li>
              </ul>
            </div>
          </div>

          {/* Legal fine-print */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-muted-foreground text-[11px] uppercase tracking-wider">
            <p>© 2026 LedgerLens. parsed in device RAM only.</p>
            <div className="flex gap-4">
              <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
              <span className="hover:text-foreground cursor-pointer">Terms of Use</span>
              <span className="hover:text-foreground cursor-pointer">Legal Info</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
