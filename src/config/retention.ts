/** §13 KVKK saklama süreleri (gün). Prod'da Supabase scheduled-delete ile uygulanır. */
export const RETENTION = {
  eventsDays: 180, // olaylar: 6 ay
  leadsDays: 730, // lead'ler: 24 ay
  /** Dosya fallback'inde tutulacak azami olay satırı */
  eventsFileMax: 20000,
} as const;
