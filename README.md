# REDMEDYA.CO — Ultra Premium Wedding Platform

Ankara merkezli premium düğün fotoğrafçılığı markası için dönüşüm odaklı Next.js platformu.

## Stack

- **Next.js 16** (App Router, SSR)
- **React 19** + **TypeScript**
- **Tailwind CSS v4** + custom design tokens
- **Framer Motion** — cinematic animations
- **Zustand** — package builder & cart state
- **Prisma** + **PostgreSQL** (Supabase uyumlu)
- **Radix UI** — accessible primitives (shadcn-style)

## Başlangıç

```bash
cd redmedya
cp .env.example .env
# DATABASE_URL ve Meta Pixel ID'yi doldurun
npm install
npx prisma generate
npx prisma migrate dev   # DB hazır olduğunda
npm run dev
```

`http://localhost:3000`

## Proje Yapısı

```
src/
├── app/              # Routes (homepage, paket-olustur, admin, api)
├── components/
│   ├── ui/           # Design system primitives
│   ├── layout/       # Navbar, footer, sticky actions
│   ├── home/         # Homepage sections
│   ├── package/      # Package builder + cart
│   ├── analytics/    # Meta Pixel
│   └── seo/          # JSON-LD
├── config/           # Site config, default services
├── lib/              # Prisma, WhatsApp, Meta Pixel utils
├── stores/           # Zustand package store
└── styles/           # Design tokens
prisma/schema.prisma  # Full data model
```

## Özellikler (Faz 1)

- [x] Premium design system (champagne / black palette)
- [x] Cinematic hero + intro loader
- [x] Floating navbar (scroll blur)
- [x] Stats + animated counters
- [x] Netflix-style stories slider
- [x] Testimonials section
- [x] Package builder + sticky cart
- [x] Bundle discounts + coupon (demo codes)
- [x] WhatsApp reservation message builder
- [x] Meta Pixel event hooks
- [x] Conversion toasts / social proof
- [x] SEO (metadata, sitemap, robots, schema)
- [x] Mobile sticky WhatsApp + call
- [ ] Admin panel (skeleton ready)
- [ ] VIP couple portal
- [ ] İyzico / Stripe checkout
- [ ] Blog CMS pages

## Demo Kupon Kodları

- `RED2026` — %10 indirim
- `VIP5000` — 5000₺ sabit indirim

## Meta Pixel Events

`ViewContent`, `AddToCart`, `PackageBuild`, `ServiceSelect`, `InitiateCheckout`, `Lead`, `WhatsAppClick`, `DiscountUse`, `FormStart`, `FormComplete`

## Lisans

Özel proje — REDMEDYA.CO
