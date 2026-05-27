import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || "3000";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const standaloneDir = fileURLToPath(new URL("../.next/standalone", import.meta.url));
const standaloneServer = path.join(standaloneDir, "server.js");

/** Build sonrası standalone varsa her zaman onu kullan (next start standalone ile çalışmaz) */
const useStandalone = fs.existsSync(standaloneServer);

if (!useStandalone) {
  console.error(
    "[start] .next/standalone/server.js bulunamadı — önce npm run build çalıştırın"
  );
  process.exit(1);
}

console.log(`[start] standalone server → ${hostname}:${port}`);

const child = spawn(process.execPath, ["server.js"], {
  cwd: standaloneDir,
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: port,
    HOSTNAME: hostname,
  },
});

child.on("exit", (code) => process.exit(code ?? 1));
