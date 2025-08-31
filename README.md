# Boroma — On-Demand Tech Support for Seniors

- Light, white theme (no site-wide shadow), orange gradient accents.
- Center hero image with offset cards.
- Portal at **/dashboard**: Dashboard, Calls, Members, Billing, Settings.
- APIs: `/api/eligibility`, `/api/webhooks/vapi`, `/api/webhooks/stripe`.
- DB schema + RLS + `minutes_used_current_month()` in `supabase.sql`.

## Quick start
1) Copy `.env.example` → `.env.local` and fill the values.
2) In Supabase SQL Editor: paste **supabase.sql**, run.
3) `npm i` then `npm run dev` (locally) or deploy on **Netlify** and add env vars.
4) Point your voice agent to **GET** `/api/eligibility?phone=+1555...` before connecting calls.
5) Set Vapi webhook to **POST** `/api/webhooks/vapi` with header `x-boroma-signature: VAPI_WEBHOOK_SECRET`.

## Env vars
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PRIMARY_PHONE`
- `VAPI_WEBHOOK_SECRET`
- (Optional) `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CUSTOMER_PORTAL_URL`
