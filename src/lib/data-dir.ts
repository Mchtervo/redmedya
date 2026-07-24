import path from "path";

/**
 * Veri klasörünün TEK kaynağı.
 *
 * NEDEN: Sunucuda uygulama `.next/standalone` içinden çalışıyor ve her deploy'da
 * postbuild repo'daki `data/` klasörünü oraya kopyalıyordu → CANLIDA EKLENEN
 * rezervasyonlar her deploy'da siliniyordu.
 *
 * ÇÖZÜM: DATA_DIR ortam değişkeni ile veriyi build çıktısının DIŞINDA,
 * kalıcı bir klasörde tut. Örn Hostinger'da:
 *   DATA_DIR=/home/<kullanici>/redmedya-data
 * Tanımlı değilse eski davranış (proje kökü/data) sürer.
 */
export const DATA_DIR = process.env.DATA_DIR?.trim()
  ? path.resolve(process.env.DATA_DIR.trim())
  : path.join(process.cwd(), "data");

export function dataPath(fileName: string): string {
  return path.join(DATA_DIR, fileName);
}
