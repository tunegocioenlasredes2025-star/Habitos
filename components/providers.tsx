"use client";

import { ToastProvider } from "./toast-provider";
import { AuthProvider } from "./auth-provider";
import { DataProvider } from "./data-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>{children}</DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
