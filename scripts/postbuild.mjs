import fs from "fs";
import path from "path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const serverFile = path.join(standaloneDir, "server.js");

if (!fs.existsSync(serverFile)) {
  console.log("[postbuild] standalone output not found, skipping asset copy");
  process.exit(0);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
  console.log(`[postbuild] copied ${path.basename(src)} -> standalone`);
}

copyDir(path.join(root, "public"), path.join(standaloneDir, "public"));
copyDir(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"));
copyDir(path.join(root, "data"), path.join(standaloneDir, "data"));

console.log("[postbuild] standalone bundle ready");
