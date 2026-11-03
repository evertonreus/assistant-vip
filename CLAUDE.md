# Atlas — asistente personal de Everton (assistant-vip)

Responde en español. Esta app es la interfaz web del proyecto "Personal Assistant VPS".

## Arquitectura
- TanStack Start (React + SSR), Tailwind, shadcn. Build con Bun; salida `node-server` (Nitro) → `.output/server/index.mjs`.
- Corre en la VPS como contenedor `assistant-web` (compose en `/opt/assistant/compose.yaml`), escucha `127.0.0.1:3100`; Caddy lo publica con HTTPS.
- **Todo dato pasa por funciones de servidor** (`src/lib/*.functions.ts`). El navegador nunca ve claves.
- Código solo-servidor en `src/lib/server/*.server.ts` (auth, cliente n8n).
- n8n se llama por la red Docker interna (`http://assistant-n8n:5678/webhook/...`). Los webhooks `assistant-*` están bloqueados desde internet en Caddy.

## Cómo publicar cambios
Push a `main` → la VPS lo despliega sola en ≤ 5 min (`deploy/auto-update.sh`, timer systemd). Si falla, queda la versión anterior y llega una alerta a la página. Por eso `main` debe estar siempre en estado funcional; para cambios grandes usa una rama y fusiona cuando esté lista.

## Reglas
- Toda función de servidor nueva que lea o cambie datos llama `requireSession()` primero.
- Secretos solo en `/opt/assistant/web.env` (600) en la VPS. Nunca en Git, OneDrive ni en el código. Ver `.env.example`.
- No reescribir historial publicado (`push --force`). Commits pequeños y en estado funcional.
- Cambios a producción (compose, Caddy, n8n activo): respaldo previo y validación; ver `deploy/install.sh`.

## Flujos de n8n que usa la app
| Webhook interno | Flujo n8n | Uso |
|---|---|---|
| `career-radar` (POST), `career-radar-latest` (GET) | Personal AI Career Radar - Complete | Career Radar |
| `assistant-alerts` (GET), `assistant-alerts-read` (POST) | Assistant - Alertas: API interna | Página de alertas |
| — (Error Trigger) | Assistant - Alertas: registrar | Guarda fallas en la data table `assistant_alertas` |
| `assistant-alerts-add` (POST, desde el host) | Assistant - Alertas: API interna | Alertas del despliegue automático |

## Estado
- Fase 1: login real, Career Radar real, alertas reales. Chat, proyectos, archivos, visuales y automatizaciones siguen con datos de ejemplo (`src/services/mock`).
- Siguiente: chat con memoria (n8n + Ollama + Postgres/pgvector), pendientes y reuniones.
