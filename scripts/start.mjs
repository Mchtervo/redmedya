import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ensurePersistentDataDir } from "./ensure-data-dir.mjs";

function loadEnvFile(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) continue;
    if (!process.env[key]) process.env[key] = val;
  }
}

const port = process.env.PORT || "3000";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const dataDir = ensurePersistentDataDir();
loadEnvFile(join(dataDir, ".env"));
loadEnvFile(join(dataDir, "telegram.env"));

console.log(`[start] next start → ${hostname}:${port}`);

const child = spawn(
  "npx",
  ["next", "start", "--hostname", hostname, "--port", port],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      NODE_ENV: "production",
      DATA_DIR: dataDir,
    },
  }
);

child.on("exit", (code) => process.exit(code ?? 1));
