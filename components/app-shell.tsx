"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, Cloud, HardDrive, Sparkles, Shield } from "lucide-react";
import { NAV, type NavItem } from "./nav-config";
import { useAuth } from "./auth-provider";
import { useData } from "./data-provider";
import { computePoints, levelInfo, levelTitle } from "@/lib/gamification";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";

function Brand({ collapsed }: { collapsed?: boolean }) {
  const { isAdmin } = useAuth();
  return (
    <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
        <Sparkles size={18} className="text-white" />
      </div>
      {!collapsed && (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">Momentum</span>
      )}
    </Link>
  );
}

function LevelCard() {
  const { habits, goals, logs } = useData();
  const points = computePoints(habits, logs, goals);
  const lvl = levelInfo(points);
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          Nivel {lvl.level} · {levelTitle(lvl.level)}
        </span>
        <span className="text-xs text-muted-2">{lvl.total} pts</span>
      </div>
      <Progress value={lvl.pct} className="mt-2.5" height={6} color="var(--secondary)" />
      <p className="mt-2 text-[11px] text-muted-2">
        {lvl.span - lvl.into} pts para el nivel {lvl.level + 1}
      </p>
    </div>
  );
}

const ADMIN_ITEM: NavItem = { href: "/admin", label: "Administración", icon: Shield };

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  // Admin accounts are control-only: they only see the admin panel.
  const items = isAdmin ? [ADMIN_ITEM] : NAV;
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Icon size={18} className="shrink-0" />
            {item.label}
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut, mode, isAdmin } = useAuth();
  const initial = (user?.display_name || "U").charAt(0).toUpperCase();
  return (
    <div className="flex flex-col gap-3">
      {!isAdmin && <LevelCard />}
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2 p-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-sm font-semibold text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{user?.display_name}</p>
          <p className="flex items-center gap-1 text-[11px] text-muted-2">
            {mode === "supabase" ? <Cloud size={11} /> : <HardDrive size={11} />}
            {mode === "supabase" ? "Sincronizado" : "Local"}
          </p>
        </div>
        <button
          onClick={() => {
            onNavigate?.();
            signOut();
          }}
          className="rounded-lg p-2 text-muted-2 transition hover:bg-surface hover:text-danger"
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();

  useEffect(() => setDrawer(false), [pathname]);

  return (
    <div className="app-aurora relative min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface/60 backdrop-blur-xl lg:flex">
        <div className="p-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <NavLinks />
        </div>
        <div className="p-3">
          <UserFooter />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:hidden">
        <Brand />
        <button
          onClick={() => setDrawer(true)}
          className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-foreground"
          aria-label="Menú"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            style={{ animation: "overlay-in 0.2s ease" }}
            onClick={() => setDrawer(false)}
          />
          <div
            className="absolute right-0 top-0 flex h-full w-[82%] max-w-xs flex-col border-l border-border bg-surface"
            style={{ animation: "dialog-in 0.24s cubic-bezier(0.22,1,0.36,1)" }}
          >
            <div className="flex items-center justify-between p-5">
              <Brand />
              <button
                onClick={() => setDrawer(false)}
                className="rounded-lg p-2 text-muted-2 hover:bg-surface-2 hover:text-foreground"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3">
              <NavLinks onNavigate={() => setDrawer(false)} />
            </div>
            <div className="p-3">
              <UserFooter onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="relative z-10 lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  // Admin is control-only — no bottom tab bar (uses the side menu instead).
  if (isAdmin) return null;
  const items = NAV.filter((i) => i.primary);
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-2",
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
