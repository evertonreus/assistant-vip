import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Bell, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import { Page, PageHeader } from "@/components/app/AppShell";
import { listAlerts, markAlertRead, type Alert } from "@/lib/alerts.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alertas — Atlas" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const load = useServerFn(listAlerts);
  const markRead = useServerFn(markAlertRead);
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await load();
      if (res.ok) setAlerts(res.alerts);
      else setError(res.error);
    } catch {
      setError("No se pudieron cargar las alertas.");
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => { void refresh(); }, [refresh]);

  const onRead = async (id: string) => {
    setAlerts((prev) => prev?.map((a) => (a.id === id ? { ...a, read: true } : a)) ?? prev);
    try { await markRead({ data: { id } }); } catch { /* se reintenta al refrescar */ }
  };

  const unread = alerts?.filter((a) => !a.read).length ?? 0;

  return (
    <Page>
      <PageHeader title="Alertas" description="Fallas de los flujos de n8n y del sistema." />
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {alerts == null ? "Cargando…" : unread === 0 ? "Sin alertas pendientes." : `${unread} sin revisar`}
        </p>
        <button onClick={() => void refresh()} disabled={loading} className="flex h-9 items-center gap-2 rounded-xl border px-3 text-sm hover:bg-accent disabled:opacity-60">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Actualizar
        </button>
      </div>
      {error && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {alerts && alerts.length === 0 && !error && (
        <section className="flex flex-col items-center gap-2 rounded-3xl border bg-surface p-10 text-center">
          <Bell className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Todo funciona. Aquí aparecerá cualquier falla.</p>
        </section>
      )}
      <ul className="space-y-2">
        {alerts?.map((a) => (
          <li key={a.id} className={cn("rounded-2xl border bg-surface p-4", !a.read && "border-destructive/40")}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={cn("mt-0.5 size-4 shrink-0", a.read ? "text-muted-foreground" : "text-destructive")} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.workflow || "Flujo desconocido"}{a.node && <span className="text-muted-foreground"> · {a.node}</span>}</p>
                <p className="mt-1 break-words text-sm text-muted-foreground">{a.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.createdAt && !isNaN(Date.parse(a.createdAt)) ? new Date(a.createdAt).toLocaleString("es-MX") : a.createdAt}
                  {a.executionUrl && <> · <a href={a.executionUrl} target="_blank" rel="noreferrer" className="underline">ver ejecución</a></>}
                </p>
              </div>
              {!a.read && (
                <button onClick={() => void onRead(a.id)} className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:bg-accent" aria-label="Marcar como vista">
                  <CheckCheck className="size-4" /> Vista
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
}
