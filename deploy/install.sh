#!/usr/bin/env bash
# Instalación / actualización de la página Atlas en la VPS (ejecutar como root en el host).
#   bash /opt/assistant/web/deploy/install.sh [dominio]
# Idempotente: se puede volver a ejecutar para actualizar.
# Respaldos: compose.yaml y Caddyfile se copian con sufijo .backup-before-web-<fecha> antes de cambiarlos.
set -euo pipefail

DOMAIN="${1:-atlas.makein3d.mx}"
BASE=/opt/assistant
WEB="$BASE/web"
ENVFILE="$BASE/web.env"
COMPOSE="$BASE/compose.yaml"
CADDY=/etc/caddy/Caddyfile
STAMP="$(date +%Y%m%d-%H%M%S)"

say() { printf '\n==> %s\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "Ejecuta como root."; exit 1; }
[ -d "$WEB/.git" ] || { echo "No existe $WEB. Clona primero el repositorio (ver deploy/DEPLOY.md)."; exit 1; }

say "1/6 Actualizando código"
git -C "$WEB" pull --ff-only

say "2/6 Secretos ($ENVFILE)"
if [ ! -f "$ENVFILE" ]; then
  umask 077
  read -rp "Usuario para entrar a la página [everton]: " APPUSER; APPUSER="${APPUSER:-everton}"
  echo "Elige la contraseña de la página (no se muestra al escribir):"
  TMPD="$(mktemp -d)"; chmod 777 "$TMPD"
  docker run --rm -it -u 1000 -e HASH_OUT=/out/hash -v "$WEB/scripts:/s:ro" -v "$TMPD:/out" node:22-slim node /s/hash-password.mjs
  HASH="$(tr -d '\r\n' < "$TMPD/hash")"; rm -rf "$TMPD"
  case "$HASH" in scrypt:*) ;; *) echo "No se generó el hash."; exit 1;; esac
  {
    echo "APP_USER=$APPUSER"
    echo "APP_PASSWORD_HASH=$HASH"
    echo "SESSION_SECRET=$(openssl rand -base64 48 | tr -d '\n')"
    echo "N8N_WEBHOOK_SECRET=$(openssl rand -hex 24)"
  } > "$ENVFILE"
  chmod 600 "$ENVFILE"
  echo "Creado $ENVFILE (600)."
else
  echo "Ya existe; no se modifica."
fi

say "3/6 docker compose (servicio web)"
if grep -q "container_name: assistant-web" "$COMPOSE"; then
  echo "El servicio ya existe; no se modifica."
else
  if ss -tln | grep -q '127.0.0.1:3100 '; then echo "El puerto 127.0.0.1:3100 está ocupado."; exit 1; fi
  cp "$COMPOSE" "$COMPOSE.backup-before-web-$STAMP"
  python3 - "$COMPOSE" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
block = """
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    container_name: assistant-web
    restart: unless-stopped
    env_file:
      - ./web.env
    environment:
      NODE_ENV: production
      PORT: 3000
      HOST: 0.0.0.0
      N8N_INTERNAL_URL: http://assistant-n8n:5678
    ports:
      - "127.0.0.1:3100:3000"
    networks:
      - assistant-net
    depends_on:
      - n8n

"""
marker = "\nvolumes:\n"
assert s.count(marker) == 1, "No encontré la sección volumes: del compose"
s = s.replace(marker, block + marker)
open(p, "w").write(s)
print("Servicio web agregado.")
PY
  docker compose -f "$COMPOSE" config -q || { echo "Compose inválido; restaurando respaldo."; cp "$COMPOSE.backup-before-web-$STAMP" "$COMPOSE"; exit 1; }
fi

say "4/6 Construyendo y arrancando assistant-web (tarda unos minutos la primera vez)"
docker compose -f "$COMPOSE" up -d --build web

say "5/6 Caddy ($DOMAIN)"
if grep -q "^$DOMAIN {" "$CADDY"; then
  echo "El sitio ya existe en Caddy; no se modifica."
else
  cp "$CADDY" "$CADDY.backup-before-web-$STAMP"
  cat >> "$CADDY" <<EOF2

$DOMAIN {
	encode zstd gzip
	header {
		Strict-Transport-Security "max-age=31536000"
		X-Content-Type-Options nosniff
		Referrer-Policy strict-origin-when-cross-origin
		X-Frame-Options DENY
		X-Robots-Tag "noindex, nofollow"
	}
	reverse_proxy 127.0.0.1:3100
}
EOF2
  if caddy validate --config "$CADDY" --adapter caddyfile >/dev/null 2>&1; then
    systemctl reload caddy && echo "Caddy recargado."
  else
    echo "Caddyfile inválido; restaurando respaldo."; cp "$CADDY.backup-before-web-$STAMP" "$CADDY"; exit 1
  fi
fi

say "5b/6 Cerrar webhooks internos del asistente en el dominio público de n8n"
if grep -q "@assistant_interno" "$CADDY"; then
  echo "Ya están cerrados."
else
  cp "$CADDY" "$CADDY.backup-before-webhook-block-$STAMP"
  python3 - "$CADDY" <<'PY'
import re, sys
p = sys.argv[1]; s = open(p).read()
m = re.search(r"^n8n\.makein3d\.mx\s*\{\n", s, re.M)
assert m, "No encontré el bloque n8n.makein3d.mx"
ins = "\t# Webhooks internos de la página Atlas: solo por la red Docker\n\t@assistant_interno path /webhook/assistant-* /webhook-test/assistant-*\n\trespond @assistant_interno 404\n"
s = s[:m.end()] + ins + s[m.end():]
open(p, "w").write(s)
print("Bloqueo agregado.")
PY
  if caddy validate --config "$CADDY" --adapter caddyfile >/dev/null 2>&1; then
    systemctl reload caddy && echo "Caddy recargado."
  else
    echo "Caddyfile inválido; restaurando respaldo."; cp "$CADDY.backup-before-webhook-block-$STAMP" "$CADDY"; exit 1
  fi
fi

say "6/6 Verificación"
for i in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3100/login || true)"
  [ "$code" = 200 ] && break; sleep 2
done
echo "Página local: HTTP $code (esperado 200)"
echo "Sin sesión, / debe redirigir a /login: HTTP $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3100/)"
echo "Webhook interno desde internet (esperado 404): HTTP $(curl -s -o /dev/null -w '%{http_code}' https://n8n.makein3d.mx/webhook/assistant-alerts)"
echo "Alertas desde la red interna (esperado 200): HTTP $(docker exec assistant-web node -e "fetch('http://assistant-n8n:5678/webhook/assistant-alerts').then(r=>console.log(r.status)).catch(()=>console.log('ERR'))")"
echo "DNS de $DOMAIN: $(getent hosts "$DOMAIN" | awk '{print $1}' || true) (debe ser la IP de esta VPS)"
echo
echo "Listo. Abre https://$DOMAIN cuando el DNS apunte a esta VPS."
