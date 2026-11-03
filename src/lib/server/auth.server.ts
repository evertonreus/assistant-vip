/**
 * Autenticación de un solo usuario (solo servidor).
 * - Contraseña: hash scrypt en APP_PASSWORD_HASH (formato scrypt:N:r:p:saltB64:hashB64),
 *   generado con `npm run hash-password`.
 * - Sesión: token firmado con HMAC-SHA256 (SESSION_SECRET) en cookie HttpOnly.
 * Ningún secreto llega al navegador.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getCookie } from "@tanstack/react-start/server";

export const SESSION_COOKIE = "av_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 días

function env(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Falta la variable de entorno ${name}`);
  return v.trim();
}

export function verifyPassword(password: string): boolean {
  const stored = env("APP_PASSWORD_HASH");
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts as [string, string, string, string, string, string];
  const expected = Buffer.from(hashB64, "base64");
  const actual = scryptSync(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(nStr),
    r: Number(rStr),
    p: Number(pStr),
    maxmem: 256 * 1024 * 1024,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verifyUser(user: string): boolean {
  const expected = Buffer.from(env("APP_USER").toLowerCase());
  const given = Buffer.from(user.trim().toLowerCase());
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function sign(payload: string): string {
  return createHmac("sha256", env("SESSION_SECRET")).update(payload).digest("base64url");
}

export function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ u: env("APP_USER"), exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000, n: randomBytes(8).toString("hex") }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined | null): { user: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { u?: string; exp?: number };
    if (!data.u || !data.exp || data.exp < Date.now()) return null;
    return { user: data.u };
  } catch {
    return null;
  }
}

/** Freno simple contra fuerza bruta: 5 intentos fallidos por IP cada 15 minutos. */
const failures = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export function isLockedOut(ip: string): boolean {
  const f = failures.get(ip);
  if (!f) return false;
  if (f.until < Date.now()) {
    failures.delete(ip);
    return false;
  }
  return f.count >= MAX_FAILURES;
}

export function recordFailure(ip: string): void {
  const now = Date.now();
  const f = failures.get(ip);
  if (!f || f.until < now) failures.set(ip, { count: 1, until: now + WINDOW_MS });
  else f.count += 1;
}

export function clearFailures(ip: string): void {
  failures.delete(ip);
}

/** Lanza error si no hay sesión válida. Llamar al inicio de cada función de servidor protegida. */
export function requireSession(): { user: string } {
  const session = readSessionToken(getCookie(SESSION_COOKIE));
  if (!session) throw new Error("No autorizado");
  return session;
}
