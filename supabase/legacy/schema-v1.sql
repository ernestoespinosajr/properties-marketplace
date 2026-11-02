-- Activa Comercial — schema inicial
-- Ejecutar en Supabase SQL Editor (Project → SQL Editor → New query → pegar → Run)

create table if not exists plans (
  id text primary key,
  nombre text not null,
  rango text not null,
  min_props integer not null,
  max_props integer,
  precio integer not null,
  periodo text not null,
  destacado boolean not null default false,
  beneficios text[] not null default '{}',
  orden integer not null default 0
);

create table if not exists properties (
  id text primary key,
  titulo text not null,
  ubicacion text not null,
  operacion text not null check (operacion in ('venta', 'renta')),
  categoria text not null check (categoria in ('industrial', 'solar', 'local', 'oficina')),
  precio integer not null,
  superficie integer not null,
  uso_suelo text not null,
  disponibilidad text not null check (disponibilidad in ('inmediata', '30-dias', 'preventa')),
  antiguedad integer not null default 0,
  dato_label text not null,
  dato_valor text not null,
  imagen text not null,
  descripcion text not null,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  tipo text not null,
  ubicacion text not null,
  detalles text,
  plan_id text references plans(id),
  created_at timestamptz not null default now()
);

alter table plans enable row level security;
alter table properties enable row level security;
alter table leads enable row level security;

-- lectura pública de catálogo (properties, plans)
create policy "public read plans" on plans for select using (true);
create policy "public read properties" on properties for select using (true);

-- leads: cualquiera puede insertar (formulario público), nadie puede leer via anon key
create policy "public insert leads" on leads for insert with check (true);
