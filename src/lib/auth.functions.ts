import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  clearFailures,
  createSessionToken,
  isLockedOut,
  readSessionToken,
  recordFailure,
  verifyPassword,
  verifyUser,
} from "./server/auth.server";

function clientIp(): string {
  // Caddy agrega X-Forwarded-For; el contenedor solo escucha en 127.0.0.1.
  const fwd = getRequestHeader("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}

/** Sesión actual (o null). Seguro de llamar desde cualquier ruta. */
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  return readSessionToken(getCookie(SESSION_COOKIE));
});

export type LoginResult = { ok: true } | { ok: false; error: string };

export const login = createServerFn({ method: "POST" })
  .inputValidator((input: { user?: unknown; password?: unknown }) => ({
    user: typeof input?.user === "string" ? input.user.slice(0, 200) : "",
    password: typeof input?.password === "string" ? input.password.slice(0, 500) : "",
  }))
  .handler(async ({ data }): Promise<LoginResult> => {
    const ip = clientIp();
    if (isLockedOut(ip)) return { ok: false, error: "Demasiados intentos. Espera 15 minutos." };
    let valid = false;
    try {
      // Verificar ambos siempre, para no revelar cuál falló.
      const userOk = verifyUser(data.user);
      const passOk = verifyPassword(data.password);
      valid = userOk && passOk;
    } catch (e) {
      console.error("[auth] configuración incompleta:", e instanceof Error ? e.message : e);
      return { ok: false, error: "El servidor no tiene configurado el acceso." };
    }
    if (!valid) {
      recordFailure(ip);
      return { ok: false, error: "Usuario o contraseña incorrectos." };
    }
    clearFailures(ip);
    setCookie(SESSION_COOKIE, createSessionToken(), {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return { ok: true };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true };
});
