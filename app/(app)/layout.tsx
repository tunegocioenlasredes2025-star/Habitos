"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

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
