#!/usr/bin/env bash
# Despliegue automático de Atlas: si hay commits nuevos en origin/main, actualiza y reconstruye assistant-web.
# Lo ejecuta el timer systemd assistant-web-update (cada 5 min). Solo sale conexiones a GitHub; no abre puertos.
# Si la compilación falla, Docker conserva el contenedor anterior y se registra una alerta en n8n.
set -uo pipefail

WEB=/opt/assistant/web
COMPOSE=/opt/assistant/compose.yaml
LOG=/var/log/assistant-web-deploy.log
ALERT_URL=http://127.0.0.1:5678/webhook/assistant-alerts-add
FAILED=/var/lib/assistant-web-last-failed   # commit que ya falló: no reintentar ni repetir la alerta

exec 9>/run/assistant-web-update.lock
flock -n 9 || exit 0   # ya hay un despliegue en curso

log() { printf '%s %s\n' "$(date '+%F %T')" "$*" >> "$LOG"; }
alert() {
  local msg="$1"
  curl -s -m 10 -X POST -H 'Content-Type: application/json' \
    -d "$(printf '{"workflow":"Despliegue Atlas","node":"auto-update","message":%s}' "$(printf '%s' "$msg" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()[:900]))')")" \
    "$ALERT_URL" >/dev/null 2>&1 || true
}

cd "$WEB" || exit 1
git fetch -q origin main 2>>"$LOG" || { log "git fetch falló"; exit 0; }
LOCAL="$(git rev-parse HEAD)"; REMOTE="$(git rev-parse origin/main)"
[ "$LOCAL" = "$REMOTE" ] && exit 0
[ -f "$FAILED" ] && [ "$(cat "$FAILED")" = "$REMOTE" ] && exit 0
fail() { echo "$REMOTE" > "$FAILED"; }

log "Nuevo commit $REMOTE (antes $LOCAL). Desplegando…"
if ! git merge -q --ff-only origin/main >>"$LOG" 2>&1; then
  log "No se pudo avanzar main (cambios locales en la VPS)."; fail; alert "No se pudo actualizar el código en la VPS: hay cambios locales en /opt/assistant/web."; exit 1
fi

if ! docker compose -f "$COMPOSE" up -d --build web >>"$LOG" 2>&1; then
  log "Fallo de compilación/arranque; se mantiene la versión anterior."
  alert "Falló el despliegue del commit ${REMOTE:0:7}. Se mantiene la versión anterior. Revisa $LOG en la VPS."
  git reset -q --hard "$LOCAL"   # vuelve el código al commit que sí funciona
  fail
  exit 1
fi

for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3100/login || true)"
  [ "$code" = 200 ] && { log "OK: ${REMOTE:0:7} en línea."; rm -f "$FAILED"; exit 0; }
  sleep 2
done
log "La nueva versión no respondió (HTTP $code)."
fail
alert "La versión ${REMOTE:0:7} se desplegó pero no responde (HTTP $code). Revisa: docker logs assistant-web"
exit 1
