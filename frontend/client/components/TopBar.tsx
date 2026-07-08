import React, { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppState } from "@/hooks/useAppState";

// Route → display title map
const PAGE_TITLES: Record<string, string> = {
  "/enhanced/dashboard": "Dashboard",
  "/enhanced/transactions": "Transactions",
  "/enhanced/analytics": "Analytics",
  "/enhanced/documents": "Documents",
  "/enhanced/alerts": "Alerts",
  "/enhanced/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? "LedgerLens";
}

// ─── Notification dropdown ─────────────────────────────────────────────────
interface NotifDropdownProps {
  alertCount: number;
  onClose: () => void;
}

function NotifDropdown({ alertCount, onClose }: NotifDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items =
    alertCount > 0
      ? [
          {
            id: 1,
            title: "Statement flags detected",
            desc: `${alertCount} unresolved alerts need your attention.`,
            time: "2 min ago",
            unread: true,
          },
          {
            id: 2,
            title: "New transactions imported",
            desc: "Your latest bank statement was processed.",
            time: "1 hr ago",
            unread: false,
          },
        ]
      : [];

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-[320px] z-50 rounded-xl border border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden"
      style={{ animation: "topbar-fade-in 0.15s ease" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Notifications</span>
        {alertCount > 0 && (
          <span className="text-[11px] text-primary font-semibold">
            {alertCount} unread
          </span>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No new notifications
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 px-4 py-3 hover:bg-sub-card transition-colors cursor-pointer"
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                  item.unread ? "bg-primary" : "bg-transparent"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {item.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                  {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border bg-sub-card">
        <button
          onClick={onClose}
          className="text-[11px] text-primary font-semibold hover:underline"
        >
          View all notifications →
        </button>
      </div>
    </div>
  );
}

// ─── Profile dropdown ──────────────────────────────────────────────────────
interface ProfileDropdownProps {
  userName: string;
  userEmail: string;
  userInitials: string;
  onClose: () => void;
}

function ProfileDropdown({
  userName,
  userEmail,
  userInitials,
  onClose,
}: ProfileDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const menuItems = [
    { icon: User, label: "Profile", onClick: () => {} },
    { icon: Settings, label: "Settings", onClick: () => {} },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-[220px] z-50 rounded-xl border border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden"
      style={{ animation: "topbar-fade-in 0.15s ease" }}
    >
      {/* User info header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center uppercase flex-shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{userName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1">
        {menuItems.map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            onClick={() => { onClick(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-sub-card transition-colors text-left"
          >
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            {label}
          </button>
        ))}
      </div>

      {/* Sign out */}
      <div className="border-t border-border py-1">
        <button
          onClick={() => {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_name");
            localStorage.removeItem("user_username");
            localStorage.removeItem("user_email");
            localStorage.removeItem("user_phone");
            localStorage.removeItem("user_currency");
            
            toast.message("Signed out", { description: "You have been signed out." });
            onClose();
            navigate("/enhanced");
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── TopBar ────────────────────────────────────────────────────────────────
export function TopBar() {
  const location = useLocation();
  const { alertCount, userName, userEmail, userInitials } = useAppState();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const pageTitle = getPageTitle(location.pathname);

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes topbar-fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header
        id="topbar"
        className="hidden md:flex items-center justify-between h-[64px] px-6 bg-card border-b border-border flex-shrink-0 sticky top-0 z-20 w-full"
        style={{
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {/* LEFT — Page title */}
        <div className="flex items-center gap-3">
          <h1
            className="text-foreground leading-tight"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "1.125rem",
              fontWeight: 700,
              letterSpacing: "-0.025em",
            }}
          >
            {pageTitle}
          </h1>
        </div>

        {/* RIGHT — Notification bell + Profile */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative">
            <button
              id="topbar-notif-btn"
              aria-label="Notifications"
              onClick={() => {
                setNotifOpen((v) => !v);
                setProfileOpen(false);
              }}
              className={cn(
                "relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                notifOpen
                  ? "bg-sub-card text-foreground"
                  : "text-muted-foreground hover:bg-sub-card hover:text-foreground"
              )}
            >
              <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" strokeWidth={1.75} />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary border-2 border-card" />
              )}
            </button>

            {notifOpen && (
              <NotifDropdown
                alertCount={alertCount}
                onClose={() => setNotifOpen(false)}
              />
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Profile */}
          <div className="relative">
            <button
              id="topbar-profile-btn"
              aria-label="User profile"
              onClick={() => {
                setProfileOpen((v) => !v);
                setNotifOpen(false);
              }}
              className={cn(
                "flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg transition-colors",
                profileOpen
                  ? "bg-sub-card"
                  : "hover:bg-sub-card"
              )}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center uppercase flex-shrink-0 border border-border">
                {userInitials}
              </div>

              {/* Name + status stacked */}
              <div className="text-left leading-tight hidden lg:block">
                <p
                  className="text-xs font-semibold text-foreground truncate max-w-[120px]"
                >
                  {userName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                  <span className="text-[10px] text-success font-semibold">Online</span>
                </div>
              </div>

              <ChevronDown
                className={cn(
                  "w-3 h-3 text-muted-foreground transition-transform duration-150 hidden lg:block",
                  profileOpen && "rotate-180"
                )}
              />
            </button>

            {profileOpen && (
              <ProfileDropdown
                userName={userName}
                userEmail={userEmail}
                userInitials={userInitials}
                onClose={() => setProfileOpen(false)}
              />
            )}
          </div>
        </div>
      </header>
    </>
  );
}
