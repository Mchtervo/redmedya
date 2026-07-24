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

/**
 * VERİ KLASÖRÜ — ASLA ÜZERİNE YAZMA.
 *
 * Eskiden burada `copyDir(data -> standalone/data)` vardı ve her deploy'da
 * CANLIDA eklenen rezervasyon/lead/ayar dosyalarını repo'daki eski sürümle
 * eziyordu. Artık:
 *   1) DATA_DIR tanımlıysa veri zaten build çıktısının dışında → hiç dokunma.
 *   2) Değilse SADECE hedefte OLMAYAN dosyaları tohum (seed) olarak kopyala.
 *   3) Var olan bir dosyayı hiçbir koşulda ezme; ezilme riski varsa yedek al.
 */
function seedDataDir() {
  if (process.env.DATA_DIR?.trim()) {
    console.log(
      `[postbuild] DATA_DIR tanimli (${process.env.DATA_DIR.trim()}) — veri kopyalanmadi (canli veri korundu)`
    );
    return;
  }

  const src = path.join(root, "data");
  const dest = path.join(standaloneDir, "data");
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  let seeded = 0;
  let kept = 0;
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (!fs.statSync(from).isFile()) continue;

    if (fs.existsSync(to)) {
      kept++; // canlı veri — DOKUNMA
      continue;
    }
    fs.copyFileSync(from, to);
    seeded++;
  }
  console.log(
    `[postbuild] data: ${seeded} dosya tohumlandi, ${kept} canli dosya KORUNDU (uzerine yazilmadi)`
  );
}

seedDataDir();

console.log("[postbuild] standalone bundle ready");
