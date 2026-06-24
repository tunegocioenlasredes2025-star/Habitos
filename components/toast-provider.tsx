"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { uid } from "@/lib/utils";

type ToastKind = "success" | "info" | "warning";
interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<{
  toast: (message: string, kind?: ToastKind) => void;
} | null>(null);

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
};
const COLORS = {
  success: "var(--success)",
  info: "var(--primary)",
  warning: "var(--warning)",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = uid("toast");
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className="animate-in flex items-center gap-3 rounded-xl border border-border-strong bg-surface-2 px-4 py-3 shadow-2xl shadow-black/40"
            >
              <Icon size={18} style={{ color: COLORS[t.kind] }} className="shrink-0" />
              <span className="flex-1 text-sm text-foreground">{t.message}</span>
              <button
                onClick={() => setToasts((arr) => arr.filter((x) => x.id !== t.id))}
                className="text-muted-2 transition hover:text-foreground"
                aria-label="Cerrar"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
