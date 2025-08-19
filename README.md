
# Darlix (Supabase + Next.js + Tailwind) — Latest

This starter uses Next.js (pages router), TailwindCSS and Supabase for data + auth.
Subdomains are routed by middleware:
- `darlix.com` -> `/dashboard`
- `store.darlix.com` -> `/storefront?store=store`

## Quickstart

1. Copy `.env.local.example` to `.env.local` and fill:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

2. Install:
```bash
npm install
```

3. Run dev:
```bash
npm run dev
```

### Local subdomains
Some systems support `store.localhost` automatically. If not, use:
- `127.0.0.1.nip.io:3000` (e.g. store1.127.0.0.1.nip.io:3000)
- Or edit your hosts file to add `127.0.0.1 store1.localhost`

### Supabase SQL (run in SQL editor)
```sql
create extension if not exists "uuid-ossp";

create table stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subdomain text unique not null,
  banner_url text
);

create table products (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) on delete cascade,
  name text not null,
  price numeric not null,
  image_url text
);
```

### Supabase Auth (Google)
- In Supabase console > Authentication > Providers > Google:
  - Set client ID/secret from Google Cloud
  - Add redirect URL: `http://localhost:3000` for local testing

### Vercel wildcard domain
- Add `*.darlix.com` to your Vercel project domains
- Add CNAME `*` -> `cname.vercel-dns.com` (or platform-specific)
- Vercel will provision SSL for wildcard domains

## Notes
- This starter uses the Supabase **anon key** for public reads. Protect any server-side actions and use service_role keys only on server functions if needed.
- The dashboard uses the Supabase client for auth (email/password + Google). Configure providers in Supabase console.
