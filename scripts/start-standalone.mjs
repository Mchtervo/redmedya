import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensurePersistentDataDir } from "./ensure-data-dir.mjs";

const port = process.env.PORT || "3000";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const standaloneDir = fileURLToPath(new URL("../.next/standalone", import.meta.url));
const standaloneServer = path.join(standaloneDir, "server.js");
const dataDir = ensurePersistentDataDir();

if (!fs.existsSync(standaloneServer)) {
  console.error("[start] standalone server.js not found — run DOCKER=1 npm run build");
  process.exit(1);
}

console.log(`[start] standalone → ${hostname}:${port}`);

const child = spawn(process.execPath, ["server.js"], {
  cwd: standaloneDir,
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: port,
    HOSTNAME: hostname,
    DATA_DIR: dataDir,
  },
});

child.on("exit", (code) => process.exit(code ?? 1));
