"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Cloud, HardDrive, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

const HIGHLIGHTS = [
  "Seguí hábitos por sí/no, cantidad o tiempo",
  "Rachas, niveles y estadísticas reales",
  "Planificador inteligente que arma tu día",
];

export default function LoginPage() {
  const { user, signIn, signUp, guest, mode, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (tab === "up") await signUp(name, email, password);
      else await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setBusy(false);
    }
  };

  const runGuest = async () => {
    setError(null);
    setBusy(true);
    try {
      await guest();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-aurora relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface/70 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between border-r border-border bg-gradient-to-br from-surface-2 to-surface p-9 lg:flex">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Momentum</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight">
              Construí hábitos.
              <br />
              Cumplí objetivos.
              <br />
              <span className="text-primary">Dominá tus días.</span>
            </h2>
            <ul className="mt-6 space-y-3">
              {HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-2">
            {mode === "supabase" ? <Cloud size={13} /> : <HardDrive size={13} />}
            {mode === "supabase"
              ? "Conectado a Supabase — tus datos se sincronizan."
              : "Modo local — tus datos se guardan en este dispositivo."}
          </p>
        </div>

        {/* Form panel */}
        <div className="p-7 sm:p-9">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Momentum</span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight">
            {tab === "in" ? "Bienvenido de vuelta" : "Creá tu cuenta"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {tab === "in" ? "Ingresá para continuar tu progreso." : "Empezá a construir tu sistema."}
          </p>

          <div className="mt-5 inline-flex w-full rounded-lg border border-border bg-surface-2 p-1">
            {(["in", "up"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError(null);
                }}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {t === "in" ? "Ingresar" : "Registrarme"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            {tab === "up" && (
              <Field label="Nombre">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  autoComplete="name"
                />
              </Field>
            )}
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@email.com"
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Contraseña">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={tab === "in" ? "current-password" : "new-password"}
              />
            </Field>

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {tab === "in" ? "Ingresar" : "Crear cuenta"}
                  <ArrowRight size={17} />
                </>
              )}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-2">
            <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="secondary" className="w-full" onClick={runGuest} disabled={busy}>
            Probar como invitado
          </Button>
        </div>
      </div>
    </div>
  );
}
