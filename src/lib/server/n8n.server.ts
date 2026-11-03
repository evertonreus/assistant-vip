/**
 * Cliente interno hacia n8n (solo servidor).
 * La app y n8n comparten la red Docker `assistant-net`, así que las llamadas no salen a internet.
 * N8N_INTERNAL_URL: por defecto http://assistant-n8n:5678
 * N8N_WEBHOOK_SECRET: opcional; si existe se envía en el encabezado X-Assistant-Secret.
 */
const BASE = (process.env["N8N_INTERNAL_URL"] || "http://assistant-n8n:5678").replace(/\/+$/, "");

export type N8nResult = { ok: true; status: number; text: string } | { ok: false; status: number; error: string };

export async function callWebhook(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown; timeoutMs?: number } = {},
): Promise<N8nResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 30_000);
  const headers: Record<string, string> = { Accept: "application/json" };
  const secret = process.env["N8N_WEBHOOK_SECRET"];
  if (secret) headers["X-Assistant-Secret"] = secret;
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  try {
    const res = await fetch(`${BASE}/webhook/${path.replace(/^\/+/, "")}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? null : JSON.stringify(init.body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 500) };
    return { ok: true, status: res.status, text };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return { ok: false, status: aborted ? 504 : 502, error: aborted ? "timeout" : String(e) };
  } finally {
    clearTimeout(timer);
  }
}
