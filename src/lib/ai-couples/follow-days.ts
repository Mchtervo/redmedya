/**
 * Sessiz çift takibinin gün ayarları (panel → "Otomasyon hızı"). Saf modül: tarayıcıda da kullanılır.
 * Sunucu ayar dosyasını okuyunca setFollowDays ile güncellenir; okunmadıysa varsayılan 3 / 5 / 10.
 */
export type FollowDays = { msg: number; call: number; last: number };

export const FOLLOW_DAYS_DEFAULT: FollowDays = { msg: 3, call: 5, last: 10 };

let current: FollowDays = { ...FOLLOW_DAYS_DEFAULT };

export function followDays(): FollowDays {
  return current;
}

export function setFollowDays(d: Partial<FollowDays>): void {
  const msg = Math.max(1, Math.round(Number(d.msg) || current.msg));
  const call = Math.max(msg, Math.round(Number(d.call) || current.call));
  const last = Math.max(call, Math.round(Number(d.last) || current.last));
  current = { msg, call, last };
}
