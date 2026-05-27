import { spawn } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || "3000";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const standaloneServer = fileURLToPath(
  new URL("../.next/standalone/server.js", import.meta.url)
);

const isProd = process.env.NODE_ENV === "production";
const hasStandalone = fs.existsSync(standaloneServer);

/** next.config output:standalone → next start desteklenmez; node server.js kullan */
const useStandalone = isProd && hasStandalone;

if (isProd && !hasStandalone) {
  console.error(
    "[start] Production build missing .next/standalone/server.js — run npm run build first"
  );
  process.exit(1);
}

const cmd = useStandalone ? process.execPath : "npx";
const args = useStandalone
  ? [standaloneServer]
  : ["next", "start", "--hostname", hostname, "--port", port];

console.log(
  useStandalone
    ? `[start] standalone server on ${hostname}:${port}`
    : `[start] next dev server on ${hostname}:${port}`
);

const child = spawn(cmd, args, {
  stdio: "inherit",
  shell: !useStandalone && process.platform === "win32",
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || (useStandalone ? "production" : "development"),
    PORT: port,
    HOSTNAME: hostname,
  },
});

child.on("exit", (code) => process.exit(code ?? 1));
