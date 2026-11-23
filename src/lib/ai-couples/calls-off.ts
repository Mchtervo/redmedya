/** Sesli asistan kredisi bitti: bu zamana kadar arama yapılamaz (n8n A da aynı saate kadar bekliyor).
 *  Bu sürede müşteriye "sizi arayacağız" denmez; her şey WhatsApp'tan yürür. Süre dolunca eski düzen kendiliğinden döner. */
export const CALLS_OFF_UNTIL = Date.parse("2026-11-24T15:20:00Z");
export const callsOff = (now: Date) => now.getTime() < CALLS_OFF_UNTIL;
