"use client";

import { useEffect, useState } from "react";

/**
 * iOS Safari'de klavye açılınca `position: fixed` alt bar klavyenin ARKASINDA
 * kalır (layout viewport küçülmez, visual viewport küçülür). Bu hook, görsel
 * viewport ile layout viewport farkından klavye yüksekliğini hesaplar; alt
 * bara `bottom: inset` verilince CTA klavyenin ÜSTÜNDE görünür kalır.
 *
 * Klavye kapalıyken 0 döner (davranış değişmez). Masaüstünde her zaman 0.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // layout viewport dibi ile görsel viewport dibi arasindaki fark = klavye
      const overlap = window.innerHeight - (vv.height + vv.offsetTop);
      setInset(overlap > 40 ? Math.round(overlap) : 0); // <40px = klavye değil
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
