"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, roleLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || roleLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Admin accounts are control-only: keep them on the admin panel.
    if (isAdmin && !pathname.startsWith("/admin")) router.replace("/admin");
  }, [loading, roleLoading, user, isAdmin, pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 animate-pulse items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-sm text-muted">Cargando…</span>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
