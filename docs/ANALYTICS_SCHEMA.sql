-- RedMedia admin funnel analytics (opsiyonel Supabase).
-- Uygulama varsayılanı: data/analytics_events.jsonl + data/analytics_sessions.json
-- Bu SQL referans şemadır; talep gelmeden otomatik uygulanmaz.

create table if not exists public.analytics_events (
  id text primary key,
  session_id text not null,
  event_name text not null,
  event_time timestamptz not null,
  page_url text,
  funnel_step text,
  metadata jsonb not null default '{}'::jsonb,
  lead_id text,
  error_code text,
  device text,
  browser text,
  os text,
  utm_source text,
  utm_campaign text,
  utm_medium text
);

create index if not exists analytics_events_session_id_idx
  on public.analytics_events (session_id);
create index if not exists analytics_events_event_name_idx
  on public.analytics_events (event_name);
create index if not exists analytics_events_event_time_idx
  on public.analytics_events (event_time desc);
create index if not exists analytics_events_lead_id_idx
  on public.analytics_events (lead_id);

create table if not exists public.analytics_sessions (
  session_id text primary key,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  landing_url text,
  last_url text,
  referrer text,
  device text,
  browser text,
  os text,
  viewport text,
  country text,
  city text,
  utm jsonb not null default '{}'::jsonb,
  fbp text,
  fbc text,
  lead_id text,
  max_funnel_step text,
  converted boolean not null default false,
  event_count int not null default 0
);

create index if not exists analytics_sessions_last_seen_idx
  on public.analytics_sessions (last_seen_at desc);
create index if not exists analytics_sessions_lead_id_idx
  on public.analytics_sessions (lead_id);

-- Retention önerisi: 180 gün (bkz. src/config/retention.ts)
-- delete from analytics_events where event_time < now() - interval '180 days';
