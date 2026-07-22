// §8 — 3 görseli indir, WebP'ye optimize et, public/images/paket-olustur/ altına koy.
// Hedef boyutlar: hero ~250KB, ürünler ~120KB. Sadece bir kez çalıştırılır.
import sharp from "sharp";
import { mkdir, writeFile, stat } from "fs/promises";
import path from "path";

const OUT = path.join(process.cwd(), "public", "images", "paket-olustur");

const JOBS = [
  {
    name: "hero-bg.webp",
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_32FbT2DH9iKzDuqqUPY3MUNuOAp/hf_20260722_164041_69c49503-aac2-43f9-a20a-9a7832177b09.png",
    width: 1920,
    quality: 72,
    targetKB: 250,
  },
  {
    name: "album-luxury.webp",
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_32FbT2DH9iKzDuqqUPY3MUNuOAp/hf_20260722_164047_81fa1bd4-4bb2-47b0-b64f-30b3db2edd86.png",
    width: 900,
    quality: 78,
    targetKB: 120,
  },
  {
    name: "drone-gift.webp",
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_32FbT2DH9iKzDuqqUPY3MUNuOAp/hf_20260722_164053_51a0bb2e-8b97-4952-a2eb-ec863c009875.png",
    width: 900,
    quality: 78,
    targetKB: 120,
  },
];

await mkdir(OUT, { recursive: true });

for (const job of JOBS) {
  const res = await fetch(job.url);
  if (!res.ok) throw new Error(`indirilemedi: ${job.name} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = path.join(OUT, job.name);

  let quality = job.quality;
  let out;
  // Hedef boyutun altına inene kadar kaliteyi kademeli düşür.
  for (let i = 0; i < 6; i++) {
    out = await sharp(buf)
      .resize({ width: job.width, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toBuffer();
    if (out.length / 1024 <= job.targetKB || quality <= 45) break;
    quality -= 6;
  }
  await writeFile(dest, out);
  const kb = (await stat(dest)).size / 1024;
  console.log(`${job.name}: ${kb.toFixed(0)}KB (q${quality}, ${job.width}w)`);
}
console.log("Bitti →", OUT);
