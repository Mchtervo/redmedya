# REDMEDYA.CO — Mimari Dokümantasyon

## Katmanlar

```
┌─────────────────────────────────────────────────────────┐
│  Presentation (Next.js App Router + React Components)   │
├─────────────────────────────────────────────────────────┤
│  Client State (Zustand — package/cart/customer)         │
├─────────────────────────────────────────────────────────┤
│  Analytics (Meta Pixel — client events)               │
├─────────────────────────────────────────────────────────┤
│  API Routes (future: leads, coupons, admin CRUD)        │
├─────────────────────────────────────────────────────────┤
│  Data (Prisma ORM → PostgreSQL / Supabase)              │
└─────────────────────────────────────────────────────────┘
```

## Route Haritası

| Route | Açıklama |
|-------|----------|
| `/` | Homepage — hero, stats, stories, testimonials, CTA |
| `/paket-olustur` | Package builder + cart + WhatsApp lead |
| `/admin/*` | CMS dashboard (services, coupons, content) |
| `/vip` | Couple delivery portal (phase 2) |
| `/api/*` | REST endpoints (phase 2) |

## Design System

- Tokens: `src/styles/design-tokens.css`
- Utilities: `globals.css` (glass, luxury gradient, section containers)
- UI primitives: `src/components/ui/*` (CVA variants)
- Typography: Cormorant Garamond (display) + DM Sans (body)

## Conversion Funnel

1. Hero CTA → `/paket-olustur`
2. Service selection → `AddToCart`, `ServiceSelect`, `PackageBuild`
3. Bundle discount psychology → conversion toast
4. Form fill → `FormStart`, `FormComplete`
5. WhatsApp → `Lead`, `WhatsAppClick`

## Database Models

`Service`, `Coupon`, `Story`, `Testimonial`, `BlogPost`, `Lead`, `VipUser`, `SiteSettings`, `AdminUser`

## Sonraki Fazlar

1. API routes + Prisma seed + admin CRUD forms
2. NextAuth admin + VIP auth
3. İyzico/Stripe webhook handlers
4. Blog dynamic routes `[slug]`
5. CMS media upload (Supabase Storage)
