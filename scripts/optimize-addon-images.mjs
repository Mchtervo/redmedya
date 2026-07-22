import sharp from "sharp";
import { writeFile, stat } from "fs/promises";
import path from "path";

const OUT = path.join(process.cwd(), "public", "images", "paket-olustur");
const BASE = "https://d8j0ntlcm91z4.cloudfront.net/user_32FbT2DH9iKzDuqqUPY3MUNuOAp/";

const JOBS = [
  { name: "album-luxury.webp", file: "hf_20260722_194030_21653bdf-9bf6-4187-b9ed-22bfa9ddfecd.png", w: 900 },
  { name: "paket1-cine.webp", file: "hf_20260722_194037_65a37130-f2b6-4738-8edb-87ac9bb73cee.png", w: 900 },
  { name: "addon-klip.webp", file: "hf_20260722_194049_57ea6cef-265b-411d-82f2-354de033f739.png", w: 400 },
  { name: "addon-omuz.webp", file: "hf_20260722_194053_79bfd86c-fc06-4218-972b-12148388e1d9.png", w: 400 },
  { name: "addon-foto.webp", file: "hf_20260722_194058_798004e9-f438-462a-9be1-c10184753a9e.png", w: 400 },
  { name: "addon-canvas.webp", file: "hf_20260722_194100_2029d9a7-6be3-4915-bbcd-9312dc3cc6a7.png", w: 400 },
];

for (const j of JOBS) {
  const res = await fetch(BASE + j.file);
  if (!res.ok) throw new Error(`indirilemedi: ${j.name}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const out = await sharp(buf).resize({ width: j.w, withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toBuffer();
  const dest = path.join(OUT, j.name);
  await writeFile(dest, out);
  console.log(`${j.name}: ${((await stat(dest)).size / 1024).toFixed(0)}KB`);
}
console.log("Bitti");
