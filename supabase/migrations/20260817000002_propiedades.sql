-- ---------------------------------------------------------------------------
-- Propiedades, galeria, historial de precio y busqueda
--
-- El broker publica directo: un anuncio nace en 'borrador' y pasa a 'activo'
-- sin revision previa. El admin modera despues con el estado 'oculto', que solo
-- el puede poner y quitar.
-- ---------------------------------------------------------------------------

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique,

  titulo text not null check (length(trim(titulo)) > 0),
  descripcion text not null default '',
  ubicacion text not null,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),

  operacion text not null check (operacion in ('venta', 'renta')),
  categoria text not null check (categoria in ('industrial', 'solar', 'local', 'oficina')),
  disponibilidad text not null default 'inmediata'
    check (disponibilidad in ('inmediata', '30-dias', 'preventa')),

  -- superficie > 0 obligatorio: precio/m2 divide entre esta columna.
  precio bigint not null check (precio > 0),
  moneda text not null default 'USD' check (moneda in ('USD', 'MXN', 'DOP')),
  superficie integer not null check (superficie > 0),

  uso_suelo text not null default '',
  antiguedad integer not null default 0 check (antiguedad >= 0),
  dato_label text not null default '',
  dato_valor text not null default '',

  estado text not null default 'borrador'
    check (estado in ('borrador', 'activo', 'pausado', 'vendido', 'oculto')),
  motivo_ocultado text,
  destacado boolean not null default false,
  vistas integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Columna generada para poder ordenar por precio/m2 en la base. Calcularlo
  -- al vuelo obligaria a traer todas las filas y ordenar en memoria, que es
  -- justo lo que la paginacion viene a evitar.
  precio_m2 numeric generated always as (precio::numeric / nullif(superficie, 0)) stored,

  busqueda tsvector generated always as (
    to_tsvector(
      'spanish',
      public.f_unaccent(coalesce(titulo, '') || ' ' || coalesce(ubicacion, '') || ' ' || coalesce(descripcion, ''))
    )
  ) stored
);

comment on column public.properties.estado is
  'borrador/activo/pausado/vendido los maneja el broker. "oculto" es moderacion: solo admin.';

create index if not exists properties_busqueda_idx on public.properties using gin (busqueda);
create index if not exists properties_owner_idx on public.properties (owner_id);
create index if not exists properties_publicas_idx on public.properties (estado, created_at desc)
  where estado = 'activo';
create index if not exists properties_precio_m2_idx on public.properties (precio_m2);
create index if not exists properties_filtros_idx on public.properties (categoria, operacion, precio, superficie);
create index if not exists properties_destacadas_idx on public.properties (destacado, created_at desc)
  where estado = 'activo' and destacado;

-- ---------------------------------------------------------------------------
-- Slug legible para las URLs
-- ---------------------------------------------------------------------------

create or replace function public.slugify(texto text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select trim(both '-' from
    regexp_replace(lower(public.f_unaccent(texto)), '[^a-z0-9]+', '-', 'g')
  )
$$;

create or replace function public.asignar_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base text;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;
  base := left(nullif(public.slugify(new.titulo), ''), 60);
  -- El sufijo del uuid evita colisiones entre titulos repetidos sin tener que
  -- reintentar en bucle.
  new.slug := coalesce(base, 'activo') || '-' || left(new.id::text, 8);
  return new;
end;
$$;

drop trigger if exists asignar_slug_propiedad on public.properties;
create trigger asignar_slug_propiedad
  before insert on public.properties
  for each row execute function public.asignar_slug();

-- ---------------------------------------------------------------------------
-- Moderacion: 'oculto' es territorio exclusivo del admin
-- ---------------------------------------------------------------------------

create or replace function public.proteger_estado_propiedad()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if new.estado = 'oculto' and old.estado <> 'oculto' and not public.es_admin() then
    raise exception 'Solo un administrador puede ocultar un anuncio.' using errcode = '42501';
  end if;

  if old.estado = 'oculto' and new.estado <> 'oculto' and not public.es_admin() then
    raise exception 'Este anuncio fue retirado por un administrador.' using errcode = '42501';
  end if;

  if new.destacado is distinct from old.destacado and not public.es_admin() then
    raise exception 'Solo un administrador destaca anuncios.' using errcode = '42501';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists proteger_estado on public.properties;
create trigger proteger_estado
  before update on public.properties
  for each row execute function public.proteger_estado_propiedad();

-- ---------------------------------------------------------------------------
-- Galeria
-- ---------------------------------------------------------------------------

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  -- Ruta dentro del bucket: hace falta para borrar el binario cuando se quita
  -- la imagen, porque la url publica no es reversible a path de forma fiable.
  path text,
  alt text not null default '',
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_images_propiedad_idx
  on public.property_images (property_id, orden);

-- ---------------------------------------------------------------------------
-- Historial de precio
--
-- Alimenta el seguimiento del portal del usuario: cuanto subio o bajo un activo
-- que tiene guardado, y cuando.
-- ---------------------------------------------------------------------------

create table if not exists public.price_history (
  id bigint generated always as identity primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  precio bigint not null,
  moneda text not null,
  registrado_en timestamptz not null default now()
);

create index if not exists price_history_propiedad_idx
  on public.price_history (property_id, registrado_en desc);

create or replace function public.registrar_precio()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or new.precio is distinct from old.precio
     or new.moneda is distinct from old.moneda then
    insert into public.price_history (property_id, precio, moneda)
    values (new.id, new.precio, new.moneda);
  end if;
  return new;
end;
$$;

drop trigger if exists registrar_precio_propiedad on public.properties;
create trigger registrar_precio_propiedad
  after insert or update of precio, moneda on public.properties
  for each row execute function public.registrar_precio();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.price_history enable row level security;

drop policy if exists "anuncios activos son publicos" on public.properties;
create policy "anuncios activos son publicos" on public.properties
  for select using (estado = 'activo');

drop policy if exists "el broker ve su inventario" on public.properties;
create policy "el broker ve su inventario" on public.properties
  for select using ((select auth.uid()) = owner_id);

drop policy if exists "admin ve todos los anuncios" on public.properties;
create policy "admin ve todos los anuncios" on public.properties
  for select using (public.es_admin());

drop policy if exists "solo brokers publican" on public.properties;
create policy "solo brokers publican" on public.properties
  for insert with check ((select auth.uid()) = owner_id and public.puede_publicar());

drop policy if exists "el broker edita lo suyo" on public.properties;
create policy "el broker edita lo suyo" on public.properties
  for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

drop policy if exists "admin edita cualquier anuncio" on public.properties;
create policy "admin edita cualquier anuncio" on public.properties
  for update using (public.es_admin()) with check (public.es_admin());

drop policy if exists "el broker borra lo suyo" on public.properties;
create policy "el broker borra lo suyo" on public.properties
  for delete using ((select auth.uid()) = owner_id or public.es_admin());

drop policy if exists "fotos de anuncios visibles" on public.property_images;
create policy "fotos de anuncios visibles" on public.property_images
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (p.estado = 'activo' or p.owner_id = (select auth.uid()) or public.es_admin())
    )
  );

drop policy if exists "el broker gestiona sus fotos" on public.property_images;
create policy "el broker gestiona sus fotos" on public.property_images
  for all using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (p.owner_id = (select auth.uid()) or public.es_admin())
    )
  ) with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (p.owner_id = (select auth.uid()) or public.es_admin())
    )
  );

drop policy if exists "historial de precio visible" on public.price_history;
create policy "historial de precio visible" on public.price_history
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (p.estado = 'activo' or p.owner_id = (select auth.uid()) or public.es_admin())
    )
  );
