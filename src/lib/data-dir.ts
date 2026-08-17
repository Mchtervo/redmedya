import fs from "fs";
import os from "os";
import path from "path";

/**
 * Canlı veri (lead, rezervasyon, analytics) TEK kaynağı.
 *
 * Hostinger GitHub deploy uygulama dizinini değiştirir. `process.cwd()/data`
 * bu yüzden her deploy'da silinir (funnel 170 → 8). Üretimde varsayılan
 * `~/redmedya-data` — ev dizini deploy ile dokunulmaz.
 *
 * Öncelik:
 *   1) DATA_DIR env (Docker volume: /app/data)
 *   2) Docker: /app/data
 *   3) production: ~/redmedya-data, yoksa ../redmedya-data
 *   4) development: <cwd>/data
 *
 * İlk açılışta eski cwd/data ve .next/standalone/data içindeki dosyalar
 * hedefte YOKSA kopyalanır; var olan canlı dosya asla ezilmez.
 */

export type DataDirSource = "env" | "docker" | "homedir" | "sibling" | "cwd";

export type DataDirMeta = {
  path: string;
  source: DataDirSource;
  persistent: boolean;
};

function isDockerRuntime(): boolean {
  if (process.env.DOCKER === "1") return true;
  try {
    return fs.existsSync("/.dockerenv");
  } catch {
    return false;
  }
}

function isWritableDir(dir: string): boolean {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function copyMissingFiles(src: string, dest: string): { copied: number; skipped: number } {
  let copied = 0;
  let skipped = 0;
  if (!fs.existsSync(src)) return { copied, skipped };
  if (path.resolve(src) === path.resolve(dest)) return { copied, skipped };

  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    let st: fs.Stats;
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

function migrateLegacyData(dest: string): { copied: number; skipped: number } {
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

function isNextBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function resolveDataDir(): DataDirMeta {
  const fromEnv = process.env.DATA_DIR?.trim();
  if (fromEnv) {
    const resolved = path.resolve(fromEnv);
    if (!isWritableDir(resolved)) {
      console.error(`[data-dir] DATA_DIR yazilabilir degil: ${resolved}`);
    }
    return { path: resolved, source: "env", persistent: true };
  }

  if (isDockerRuntime()) {
    const dockerDir = "/app/data";
    isWritableDir(dockerDir);
    return { path: dockerDir, source: "docker", persistent: true };
  }

  // next build NODE_ENV=production yazar; ev dizinine yazma / göç etme.
  if (process.env.NODE_ENV === "production" && !isNextBuild()) {
    const homedir = path.join(os.homedir(), "redmedya-data");
    if (isWritableDir(homedir)) {
      return { path: homedir, source: "homedir", persistent: true };
    }
    const sibling = path.resolve(process.cwd(), "..", "redmedya-data");
    if (isWritableDir(sibling)) {
      return { path: sibling, source: "sibling", persistent: true };
    }
    console.error(
      "[data-dir] kalici klasor yazilamadi; cwd/data kullaniliyor — DEPLOY VERI SILER"
    );
  }

  const cwdDir = path.join(process.cwd(), "data");
  isWritableDir(cwdDir);
  return { path: cwdDir, source: "cwd", persistent: false };
}

const resolved = resolveDataDir();
const migrated = isNextBuild()
  ? { copied: 0, skipped: 0 }
  : migrateLegacyData(resolved.path);

if (!isNextBuild()) {
  console.log(
    `[data-dir] DATA_DIR=${resolved.path} source=${resolved.source} persistent=${resolved.persistent} migrated=${migrated.copied} kept=${migrated.skipped}`
  );
}

export const DATA_DIR = resolved.path;
export const DATA_DIR_META: DataDirMeta = resolved;

export function dataPath(fileName: string): string {
  return path.join(DATA_DIR, fileName);
}

/** Hostinger hPanel env API yok; kalıcı DATA_DIR dosyalarını process.env'e yükle. */
function loadPersistentEnvFile(filePath: string): boolean {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    return false;
  }
  let loaded = 0;
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
    process.env[key] = val;
    loaded += 1;
  }
  return loaded > 0;
}

function persistentEnvCandidates(fileName: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const dir of [
    DATA_DIR,
    path.join(os.homedir(), "redmedya-data"),
    path.resolve(process.cwd(), "..", "redmedya-data"),
  ]) {
    const resolved = path.resolve(dir);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    out.push(path.join(resolved, fileName));
  }
  return out;
}

/** Lead anında tekrar oku — süreç, dosya yazılmadan önce ayağa kalkmış olabilir. */
export function reloadPersistentEnv(): {
  dataDir: string;
  telegramEnvExists: boolean;
  tokenSet: boolean;
  chatIdSet: boolean;
} {
  for (const envPath of persistentEnvCandidates(".env")) {
    loadPersistentEnvFile(envPath);
  }
  let telegramEnvExists = false;
  for (const telegramPath of persistentEnvCandidates("telegram.env")) {
    if (fs.existsSync(telegramPath)) telegramEnvExists = true;
    loadPersistentEnvFile(telegramPath);
  }
  return {
    dataDir: DATA_DIR,
    telegramEnvExists,
    tokenSet: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
    chatIdSet: Boolean(process.env.TELEGRAM_CHAT_ID?.trim()),
  };
}

if (!isNextBuild()) {
  const loaded = reloadPersistentEnv();
  console.log("[lead-notify] acilis env", {
    dataDir: loaded.dataDir,
    telegramEnvExists: loaded.telegramEnvExists,
    tokenSet: loaded.tokenSet,
    chatIdSet: loaded.chatIdSet,
  });
}
