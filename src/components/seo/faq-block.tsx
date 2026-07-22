import type { FaqItem } from "@/config/faq";
import { FaqJsonLd } from "./faq-jsonld";

/**
 * Görünür + taranabilir FAQ bölümü (server component, <details> — JS gerekmez).
 * İçerik ilk HTML'de olduğundan Google hem metni hem FAQPage şemasını görür.
 */
export function FaqBlock({
  items,
  title = "Sık sorulan sorular",
  className,
}: {
  items: FaqItem[];
  title?: string;
  className?: string;
}) {
  return (
    <section className={className}>
      <FaqJsonLd items={items} />
      <h2 className="font-editorial text-[clamp(1.5rem,4vw,2.25rem)] text-rm-off-white">
        {title}
      </h2>
      <div className="mt-6 divide-y divide-white/[0.06] border-y border-white/[0.06]">
        {items.map((f) => (
          <details key={f.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-medium text-rm-off-white marker:hidden">
              <span>{f.q}</span>
              <span className="shrink-0 text-rm-champagne transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-rm-gray-400">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
