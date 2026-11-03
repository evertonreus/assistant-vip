#!/usr/bin/env node
// Genera el hash scrypt para APP_PASSWORD_HASH. Uso: node scripts/hash-password.mjs
// Lee la contraseña sin mostrarla en pantalla ni guardarla en el historial.
import { randomBytes, scryptSync } from "node:crypto";
import { writeFileSync } from "node:fs";
import readline from "node:readline";

function ask(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(prompt)) process.stdout.write(s); };
    rl.question(prompt, (a) => { rl.close(); process.stdout.write("\n"); resolve(a); });
  });
}

const fromStdin = !process.stdin.isTTY;
let pw;
if (fromStdin) {
  pw = (await new Promise((r) => { let d = ""; process.stdin.on("data", (c) => (d += c)); process.stdin.on("end", () => r(d)); })).replace(/\r?\n$/, "");
} else {
  pw = await ask("Nueva contraseña: ");
  const pw2 = await ask("Repite la contraseña: ");
  if (pw !== pw2) { console.error("No coinciden."); process.exit(1); }
}
if (!pw || pw.length < 10) { console.error("Usa al menos 10 caracteres."); process.exit(1); }
const N = 16384, r = 8, p = 1;
const salt = randomBytes(16);
const hash = scryptSync(pw, salt, 32, { N, r, p });
// Separador ":" (no "$") para que docker compose no lo interprete como variable.
const out = `scrypt:${N}:${r}:${p}:${salt.toString("base64")}:${hash.toString("base64")}`;
// HASH_OUT: escribir el hash en un archivo (lo usa deploy/install.sh); si no, imprimirlo.
if (process.env.HASH_OUT) { writeFileSync(process.env.HASH_OUT, out + "\n", { mode: 0o600 }); console.log("Hash generado."); }
else console.log(out);
