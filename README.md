# Convercion de Lovable a proyecto Real

Marketplace de bienes raíces para promover propiedades comerciales, solares y locales en venta y renta.

## Stack

- TanStack Start (React 19, SSR)
- Supabase (datos, sin auth)
- Tailwind CSS v4

## Development

Requiere Bun (o Node.js).

```sh
bun install
cp .env.example .env.local   # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
bun run dev
```

## Base de datos

Schema y seed en [`supabase/schema.sql`](supabase/schema.sql) y [`supabase/seed.sql`](supabase/seed.sql) — correr en el SQL Editor del proyecto Supabase antes de levantar el dev server.

## Deploy

Build target: Vercel (nitro preset `vercel`, configurado en `vite.config.ts`).

```sh
bun run build
```

Configurar las mismas env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en el proyecto de Vercel.
