import { useState, type FormEvent } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Atlas" },
      { name: "description", content: "Acceso privado a tu asistente personal." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const doLogin = useServerFn(login);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await doLogin({ data: { user, password } });
      if (res.ok) {
        await router.invalidate();
        await router.navigate({ to: "/" });
      } else {
        setError(res.error);
      }
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glow-bg flex min-h-dvh items-center justify-center bg-background px-4">
      <form onSubmit={onSubmit} className="animate-rise w-full max-w-sm rounded-3xl border bg-card p-7 shadow-float">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="size-5" /></span>
        <h1 className="mt-5 text-2xl font-semibold">Bienvenido</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acceso privado a Atlas.</p>
        <div className="mt-6 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="user">Usuario</Label>
            <Input id="user" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} className="h-10" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Contraseña</Label>
            <Input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" required />
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="mt-6 h-10 w-full">
          {busy ? <><Loader2 className="size-4 animate-spin" /> Entrando…</> : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
