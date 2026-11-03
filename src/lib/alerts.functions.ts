import { createServerFn } from "@tanstack/react-start";
import { requireSession } from "./server/auth.server";
import { callWebhook } from "./server/n8n.server";

export type Alert = {
  id: string;
  createdAt: string;
  workflow: string;
  node: string;
  message: string;
  executionUrl: string;
  read: boolean;
};

export type AlertsResult = { ok: true; alerts: Alert[] } | { ok: false; error: string };

function toAlert(row: Record<string, unknown>): Alert {
  const s = (k: string) => (row[k] == null ? "" : String(row[k]));
  return {
    id: s("id"),
    createdAt: s("createdAt") || s("created_at"),
    workflow: s("workflow"),
    node: s("node"),
    message: s("message"),
    executionUrl: s("executionUrl") || s("execution_url"),
    read: row["read"] === true || row["read"] === "true",
  };
}

/** Lista de alertas (flujo n8n "Assistant - Alertas: listar", webhook GET assistant-alerts). */
export const listAlerts = createServerFn({ method: "GET" }).handler(async (): Promise<AlertsResult> => {
  requireSession();
  const res = await callWebhook("assistant-alerts", { timeoutMs: 15_000 });
  if (!res.ok) return { ok: false, error: "No se pudieron cargar las alertas." };
  try {
    const parsed = JSON.parse(res.text) as unknown;
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { data?: unknown }).data)
        ? ((parsed as { data: unknown[] }).data)
        : [];
    const alerts = rows
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .map(toAlert)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { ok: true, alerts };
  } catch {
    return { ok: false, error: "Respuesta de alertas no válida." };
  }
});

/** Marca una alerta como vista (flujo n8n "Assistant - Alertas: marcar vista", webhook POST assistant-alerts-read). */
export const markAlertRead = createServerFn({ method: "POST" })
  .inputValidator((input: { id?: unknown }) => ({ id: typeof input?.id === "string" ? input.id.slice(0, 64) : "" }))
  .handler(async ({ data }) => {
    requireSession();
    if (!data.id) return { ok: false as const };
    const res = await callWebhook("assistant-alerts-read", { method: "POST", body: { id: data.id } });
    return { ok: res.ok };
  });
