"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { uid } from "@/lib/utils";

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  mode: "local" | "supabase";
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  guest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---- Local (no-backend) account store ----------------------------------
interface LocalAccount {
  id: string;
  email: string;
  display_name: string;
  password: string;
}
const ACCOUNTS_KEY = "momentum:accounts";
const SESSION_KEY = "momentum:session";

function readAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeAccounts(list: LocalAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mode = supabaseConfigured ? "supabase" : "local";

  // Bootstrap session.
  useEffect(() => {
    let active = true;
    if (supabaseConfigured) {
      const sb = getSupabase()!;
      sb.auth.getSession().then(({ data }) => {
        if (!active) return;
        const s = data.session;
        if (s) {
          setUser({
            id: s.user.id,
            email: s.user.email ?? "",
            display_name: (s.user.user_metadata?.display_name as string) || s.user.email || "Usuario",
          });
        }
        setLoading(false);
      });
      const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            display_name:
              (session.user.user_metadata?.display_name as string) || session.user.email || "Usuario",
          });
        } else {
          setUser(null);
        }
      });
      return () => {
        active = false;
        sub.subscription.unsubscribe();
      };
    }

    // Local mode
    const sid = window.localStorage.getItem(SESSION_KEY);
    if (sid) {
      const acc = readAccounts().find((a) => a.id === sid);
      if (acc) setUser({ id: acc.id, email: acc.email, display_name: acc.display_name });
    }
    setLoading(false);
    return () => {
      active = false;
    };
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    email = email.trim().toLowerCase();
    if (supabaseConfigured) {
      const sb = getSupabase()!;
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });
      if (error) throw new Error(error.message);
      return;
    }
    const accounts = readAccounts();
    if (accounts.some((a) => a.email === email)) {
      throw new Error("Ya existe una cuenta con ese email.");
    }
    const acc: LocalAccount = { id: uid("user"), email, display_name: name || email, password };
    accounts.push(acc);
    writeAccounts(accounts);
    window.localStorage.setItem(SESSION_KEY, acc.id);
    setUser({ id: acc.id, email: acc.email, display_name: acc.display_name });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    email = email.trim().toLowerCase();
    if (supabaseConfigured) {
      const sb = getSupabase()!;
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return;
    }
    const acc = readAccounts().find((a) => a.email === email);
    if (!acc || acc.password !== password) {
      throw new Error("Email o contraseña incorrectos.");
    }
    window.localStorage.setItem(SESSION_KEY, acc.id);
    setUser({ id: acc.id, email: acc.email, display_name: acc.display_name });
  }, []);

  const guest = useCallback(async () => {
    if (supabaseConfigured) {
      const sb = getSupabase()!;
      const { error } = await sb.auth.signInAnonymously();
      if (error) throw new Error(error.message);
      return;
    }
    const acc: LocalAccount = {
      id: uid("guest"),
      email: `invitado-${Date.now()}@local`,
      display_name: "Invitado",
      password: "",
    };
    const accounts = readAccounts();
    accounts.push(acc);
    writeAccounts(accounts);
    window.localStorage.setItem(SESSION_KEY, acc.id);
    setUser({ id: acc.id, email: acc.email, display_name: acc.display_name });
  }, []);

  const signOut = useCallback(async () => {
    if (supabaseConfigured) {
      await getSupabase()!.auth.signOut();
    }
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, mode, signIn, signUp, signOut, guest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
