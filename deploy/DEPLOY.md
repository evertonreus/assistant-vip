# Despliegue en la VPS

Todo se ejecuta en el host como root. El instalador es idempotente: sirve para la primera instalación y para actualizar.

## 1. Llave de despliegue (solo la primera vez)
El repositorio es privado; la VPS necesita una llave de solo lectura.

```bash
ssh-keygen -t ed25519 -N "" -C "vps-assistant-vip" -f /root/.ssh/assistant_vip_deploy && cat /root/.ssh/assistant_vip_deploy.pub
```
Copia la línea que empieza con `ssh-ed25519` y agrégala en GitHub → repositorio `assistant-vip` → Settings → Deploy keys → Add deploy key (sin marcar "Allow write access").

```bash
printf 'Host github-assistant-vip\n  HostName github.com\n  User git\n  IdentityFile /root/.ssh/assistant_vip_deploy\n  IdentitiesOnly yes\n' >> /root/.ssh/config && git clone git@github-assistant-vip:evertonreus/assistant-vip.git /opt/assistant/web
```

## 2. Instalar / actualizar
```bash
bash /opt/assistant/web/deploy/install.sh atlas.makein3d.mx
```
La primera vez pide usuario y contraseña de la página (la contraseña no se muestra ni se guarda en claro).

Qué hace (con respaldo previo de cada archivo que toca):
1. `git pull` del código.
2. Crea `/opt/assistant/web.env` (600) con hash de contraseña y secretos aleatorios.
3. Agrega el servicio `web` a `/opt/assistant/compose.yaml` (solo la primera vez; valida antes de usar).
4. Construye y arranca `assistant-web` (127.0.0.1:3100).
5. Agrega el sitio a Caddy y cierra desde internet los webhooks `assistant-*` de n8n.
6. Activa el **despliegue automático** (timer systemd `assistant-web-update`).
7. Verifica: página local, redirección a login, bloqueo de webhooks y DNS.

## Actualizaciones automáticas
Después de la primera instalación no hay que hacer nada: cada 5 minutos la VPS revisa `main` en GitHub y, si hay un commit nuevo, lo descarga, reconstruye `assistant-web` y comprueba que responda.
- Si la compilación falla, sigue corriendo la versión anterior, el código vuelve al último commit bueno y aparece una **alerta** en la página (no se reintenta ese mismo commit).
- Bitácora: `/var/log/assistant-web-deploy.log`. Estado del timer: `systemctl list-timers assistant-web-update.timer`.
- Pausar: `systemctl stop assistant-web-update.timer` · Reanudar: `systemctl start assistant-web-update.timer`.
- Forzar ahora: `systemctl start assistant-web-update.service`.

## 3. DNS
Registro A: `atlas.makein3d.mx` → `2.24.100.201`. Caddy obtiene el certificado HTTPS solo.
Cuando la página esté lista para reemplazar a Lovable: cambiar `assistant.makein3d.mx` a la misma IP y ejecutar `install.sh assistant.makein3d.mx`.

## Revertir
Cada cambio deja respaldo con sufijo `.backup-before-web-<fecha>` (compose y Caddyfile). Para quitar la página:
```bash
docker compose -f /opt/assistant/compose.yaml stop web
```
