import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const hostname = process.env.HOSTNAME || "0.0.0.0";

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
    },
  }
);

child.on("exit", (code) => process.exit(code ?? 1));
