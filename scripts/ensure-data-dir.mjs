import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * start.mjs / start-standalone.mjs — Next boot etmeden DATA_DIR'i sabitle.
 * Algoritma src/lib/data-dir.ts ile aynı tutulmalı.
 */

function isDockerRuntime() {
  if (process.env.DOCKER === "1") return true;
  try {
    return fs.existsSync("/.dockerenv");
  } catch {
    return false;
  }
}

function isWritableDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function copyMissingFiles(src, dest) {
  let copied = 0;
  let skipped = 0;
  if (!fs.existsSync(src)) return { copied, skipped };
  if (path.resolve(src) === path.resolve(dest)) return { copied, skipped };

  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    let st;
    try {
      st = fs.statSync(from);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      const inner = copyMissingFiles(from, to);
      copied += inner.copied;
      skipped += inner.skipped;
      continue;
    }
    if (!st.isFile()) continue;
    if (fs.existsSync(to)) {
      skipped += 1;
      continue;
    }
    fs.copyFileSync(from, to);
    copied += 1;
  }
  return { copied, skipped };
}

function migrateLegacyData(dest) {
  const candidates = [
    path.join(process.cwd(), "data"),
    path.join(process.cwd(), ".next", "standalone", "data"),
  ];
  const cwd = process.cwd();
  if (
    path.basename(cwd) === "standalone" &&
    path.basename(path.dirname(cwd)) === ".next"
  ) {
    candidates.push(path.resolve(cwd, "..", "..", "data"));
  }
  let copied = 0;
  let skipped = 0;
  for (const src of candidates) {
    const result = copyMissingFiles(src, dest);
    copied += result.copied;
    skipped += result.skipped;
  }
  return { copied, skipped };
}

export function ensurePersistentDataDir() {
  const fromEnv = process.env.DATA_DIR?.trim();
  let dir;
  let source;

  if (fromEnv) {
    dir = path.resolve(fromEnv);
    source = "env";
  } else if (isDockerRuntime()) {
    dir = "/app/data";
    source = "docker";
  } else {
    const homedir = path.join(os.homedir(), "redmedya-data");
    if (isWritableDir(homedir)) {
      dir = homedir;
      source = "homedir";
    } else {
      const sibling = path.resolve(process.cwd(), "..", "redmedya-data");
      if (isWritableDir(sibling)) {
        dir = sibling;
        source = "sibling";
      } else {
        dir = path.join(process.cwd(), "data");
        source = "cwd";
        console.error(
          "[data-dir] kalici klasor yazilamadi; cwd/data — DEPLOY VERI SILER"
        );
      }
    }
  }

  if (!isWritableDir(dir)) {
    console.error(`[data-dir] DATA_DIR yazilabilir degil: ${dir}`);
  }

  const migrated = migrateLegacyData(dir);
  const persistent = source !== "cwd";
  console.log(
    `[data-dir] DATA_DIR=${dir} source=${source} persistent=${persistent} migrated=${migrated.copied} kept=${migrated.skipped}`
  );
  return dir;
}
