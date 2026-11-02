-- ---------------------------------------------------------------------------
-- Favoritos y consultas
-- ---------------------------------------------------------------------------

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  -- Precio congelado en el momento de guardar. Permite responder "bajo 12.000
  -- desde que la guardaste" con una resta, sin recorrer el historial completo.
  precio_al_guardar bigint,
  moneda_al_guardar text,
  nota text,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

create index if not exists favorites_usuario_idx on public.favorites (user_id, created_at desc);

create or replace function public.congelar_precio_al_guardar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.precio_al_guardar is null then
    select p.precio, p.moneda into new.precio_al_guardar, new.moneda_al_guardar
    from public.properties p where p.id = new.property_id;
  end if;
  return new;
end;
$$;

drop trigger if exists congelar_precio on public.favorites;
create trigger congelar_precio
  before insert on public.favorites
  for each row execute function public.congelar_precio_al_guardar();

-- ---------------------------------------------------------------------------
-- Consultas de interesados
--
-- user_id es opcional a proposito: un visitante sin cuenta tambien puede
-- escribir al broker.
-- ---------------------------------------------------------------------------

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  -- Denormalizado desde properties.owner_id: la policy de lectura lo consulta en
  -- cada fila y el join encarece de mas.
  broker_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  nombre text not null check (length(trim(nombre)) > 0),
  email text not null,
  telefono text,
  mensaje text not null default '',
  estado text not null default 'nueva' check (estado in ('nueva', 'leida', 'respondida', 'archivada')),
  created_at timestamptz not null default now()
);

create index if not exists inquiries_broker_idx on public.inquiries (broker_id, created_at desc);
create index if not exists inquiries_usuario_idx on public.inquiries (user_id, created_at desc);
create index if not exists inquiries_propiedad_idx on public.inquiries (property_id);

-- El broker destinatario se deduce del anuncio, nunca del cliente: si viajara en
-- el formulario, cualquiera podria dirigir consultas a la bandeja de otro.
create or replace function public.asignar_broker_consulta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select p.owner_id into new.broker_id
  from public.properties p
  where p.id = new.property_id and p.estado = 'activo';

  if new.broker_id is null then
    raise exception 'La propiedad no esta disponible para consultas.' using errcode = '22023';
  end if;

  new.user_id := (select auth.uid());
  return new;
end;
$$;

drop trigger if exists asignar_broker on public.inquiries;
create trigger asignar_broker
  before insert on public.inquiries
  for each row execute function public.asignar_broker_consulta();

-- ---------------------------------------------------------------------------
-- Contador de vistas
--
-- Un visitante anonimo no puede escribir en properties, asi que el incremento
-- pasa por esta funcion, que es lo unico que se le permite tocar.
-- ---------------------------------------------------------------------------

create or replace function public.incrementar_vistas(propiedad uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.properties set vistas = vistas + 1
  where id = propiedad and estado = 'activo';
$$;

grant execute on function public.incrementar_vistas(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.favorites enable row level security;
alter table public.inquiries enable row level security;

drop policy if exists "cada quien sus favoritos" on public.favorites;
create policy "cada quien sus favoritos" on public.favorites
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Cualquiera puede escribir al broker, tenga cuenta o no.
drop policy if exists "cualquiera consulta" on public.inquiries;
create policy "cualquiera consulta" on public.inquiries
  for insert with check (true);

drop policy if exists "el broker lee su bandeja" on public.inquiries;
create policy "el broker lee su bandeja" on public.inquiries
  for select using ((select auth.uid()) = broker_id);

drop policy if exists "el interesado ve lo que envio" on public.inquiries;
create policy "el interesado ve lo que envio" on public.inquiries
  for select using ((select auth.uid()) = user_id);

drop policy if exists "admin ve las consultas" on public.inquiries;
create policy "admin ve las consultas" on public.inquiries
  for select using (public.es_admin());

drop policy if exists "el broker gestiona su bandeja" on public.inquiries;
create policy "el broker gestiona su bandeja" on public.inquiries
  for update using ((select auth.uid()) = broker_id) with check ((select auth.uid()) = broker_id);
