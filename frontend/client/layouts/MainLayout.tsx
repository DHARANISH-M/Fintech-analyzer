import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col md:flex-row relative font-sans">

      {/* 1. Desktop Fixed Sidebar */}
      <div className="hidden md:block fixed top-0 left-0 bottom-0 h-full w-[270px] z-30 flex-shrink-0">
        <Sidebar />
      </div>

      {/* 2. Mobile Header Top Bar (Only visible < md) */}
      <header className="fixed top-0 left-0 w-full h-[56px] bg-sidebar text-foreground z-30 flex items-center justify-between px-4 border-b border-border md:hidden">
        <Link to="/enhanced/dashboard" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
          <span className="w-2 h-2 bg-primary rounded-full" />
          <span className="font-heading text-sm tracking-normal font-semibold text-foreground">LedgerLens</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 hover:bg-sub-card rounded-md transition-colors text-foreground"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 3. Mobile Navigation Drawer Overlay (Only visible < md) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />
            {/* Sidebar drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 h-full w-[270px] z-50 md:hidden flex flex-col shadow-xl"
            >
              <div className="absolute top-3.5 right-3 z-50">
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 hover:bg-sub-card rounded-md transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Sidebar onCloseMobile={() => setIsMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. Main content column — right of sidebar on desktop */}
      <div className="flex-1 h-full flex flex-col pt-[56px] md:pt-0 md:pl-[270px] overflow-hidden">
        {/* Desktop TopBar — sticky at top of content column, hidden on mobile */}
        <TopBar />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto pb-6 px-4 md:px-8 pt-6">
          <div className="w-full flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="w-full text-card-foreground flex-1 flex flex-col"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

    </div>
  );
}
