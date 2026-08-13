import fs from "fs";
import path from "path";

/**
 * Konteyner acilis betigi.
 *
 * NEDEN VAR: Her deploy YENI bir konteyner kurar; konteyner ici disk silinir.
 * Bu yuzden veri /app/data'ya baglanan KALICI VOLUME uzerinde tutulur.
 * Volume ilk kez bos geldiginde imajdaki varsayilanlari (data-seed) kopyalariz.
 * VAR OLAN dosyalar ASLA ezilmez — canli rezervasyonlar korunur.
 */
const DATA_DIR = process.env.DATA_DIR?.trim() || "/app/data";
const SEED_DIR = "/app/data-seed";

try {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(SEED_DIR)) {
    let seeded = 0;
    let kept = 0;
    for (const name of fs.readdirSync(SEED_DIR)) {
      const from = path.join(SEED_DIR, name);
      const to = path.join(DATA_DIR, name);
      if (!fs.statSync(from).isFile()) continue;
      if (fs.existsSync(to)) {
        kept++; // canli veri — DOKUNMA
        continue;
      }
      fs.copyFileSync(from, to);
      seeded++;
    }
    console.log(
      `[entrypoint] DATA_DIR=${DATA_DIR} | ${seeded} dosya tohumlandi, ${kept} canli dosya korundu`
    );
  } else {
    console.log(`[entrypoint] DATA_DIR=${DATA_DIR} (volume bagli olmali: docker-compose redmedya-data)`);
  }
} catch (e) {
  console.error("[entrypoint] veri klasoru hazirlanamadi:", e);
}

await import("/app/server.js");
