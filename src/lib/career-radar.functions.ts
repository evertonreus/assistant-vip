import { createServerFn } from "@tanstack/react-start";
import { requireSession } from "./server/auth.server";
import { callWebhook } from "./server/n8n.server";

export type CareerRadarResult =
  | { ok: true; data: string }
  | { ok: false; error: string };

/**
 * Ejecuta el Career Radar a través de n8n por la red interna.
 * Flujo n8n: "Personal AI Career Radar - Complete" (webhook POST career-radar).
 */
export const runCareerRadar = createServerFn({ method: "POST" })
  .inputValidator((input: { language?: string } | undefined) => {
    const l = input?.language;
    return { language: l === "en" || l === "pt" ? l : "es" };
  })
  .handler(async ({ data }): Promise<CareerRadarResult> => {
    requireSession();
    const res = await callWebhook("career-radar", { method: "POST", body: { language: data.language }, timeoutMs: 600_000 });
    if (res.ok) return { ok: true, data: res.text };
    if (res.status === 504) return { ok: false, error: "El Career Radar tardó demasiado. Revisa más tarde el último reporte." };
    if (res.status >= 500) return { ok: false, error: "El Career Radar no está disponible en este momento." };
    return { ok: false, error: "Algo salió mal al ejecutar el Career Radar." };
  });

/** Último reporte guardado. Nunca lanza una ejecución nueva. data = "" si no existe. */
export const getLatestCareerRadar = createServerFn({ method: "GET" }).handler(async (): Promise<CareerRadarResult> => {
  requireSession();
  const res = await callWebhook("career-radar-latest", { timeoutMs: 20_000 });
  if (res.ok) return { ok: true, data: res.text };
  if (res.status === 404) return { ok: true, data: "" };
  return { ok: false, error: "No se pudo cargar el último reporte." };
});
