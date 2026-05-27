import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || "3000";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const standaloneServer = fileURLToPath(
  new URL("../.next/standalone/server.js", import.meta.url)
);

/** Hostinger LiteSpeed reverse proxy expects the app on process.env.PORT */
const useStandalone = process.env.START_STANDALONE === "1";

const cmd = useStandalone ? process.execPath : "npx";
const args = useStandalone
  ? [standaloneServer]
  : ["next", "start", "--hostname", hostname, "--port", port];

const child = spawn(cmd, args, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    PORT: port,
    HOSTNAME: hostname,
  },
});

child.on("exit", (code) => process.exit(code ?? 1));
