-- ---------------------------------------------------------------------------
-- Perfiles y roles
--
-- Tres roles: 'usuario' (busca y guarda), 'broker' (publica), 'admin'
-- (administra la plataforma). El rol admin NO es autoasignable: ni el registro
-- ni una actualizacion posterior pueden concederlo. Se otorga a mano con:
--
--   update public.profiles set rol = 'admin' where id = '<uuid>';
--
-- ejecutado desde el SQL Editor de Supabase, que corre como superusuario y por
-- tanto salta el trigger de escalada.
-- ---------------------------------------------------------------------------

create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- unaccent() no es IMMUTABLE por si mismo (depende del diccionario), asi que no
-- puede usarse en indices ni en columnas generadas. Fijar el diccionario de
-- forma explicita la vuelve estable y permite indexarla.
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent', $1) $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol text not null default 'usuario' check (rol in ('usuario', 'broker', 'admin')),
  nombre text not null default '',
  telefono text,
  whatsapp text,
  agencia text,
  bio text,
  avatar_url text,
  verificado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.verificado is
  'Sello de agencia verificada. Solo lo concede un admin.';

-- ---------------------------------------------------------------------------
-- Helpers de rol
--
-- Consultar profiles dentro de una policy DE profiles provoca recursion
-- infinita. Estas funciones son SECURITY DEFINER, asi que leen la tabla
-- saltandose RLS y rompen el ciclo.
-- ---------------------------------------------------------------------------

create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = ''
as $$ select rol from public.profiles where id = (select auth.uid()) $$;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select coalesce(public.rol_actual() = 'admin', false) $$;

create or replace function public.puede_publicar()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select coalesce(public.rol_actual() in ('broker', 'admin'), false) $$;

-- ---------------------------------------------------------------------------
-- Alta automatica de perfil al registrarse
--
-- El rol llega en la metadata del signup, pero se recorta a 'usuario' o
-- 'broker'. Cualquier otro valor -- 'admin' incluido -- cae a 'usuario'.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rol_pedido text := new.raw_user_meta_data ->> 'rol';
begin
  insert into public.profiles (id, rol, nombre, telefono, whatsapp, agencia)
  values (
    new.id,
    case when rol_pedido = 'broker' then 'broker' else 'usuario' end,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'telefono'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'whatsapp'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'agencia'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Candado contra escalada de privilegios
--
-- Un usuario puede editar su perfil pero no su rol ni su sello de verificado.
-- Solo un admin (o el SQL Editor, que corre como superusuario) los cambia.
-- ---------------------------------------------------------------------------

create or replace function public.proteger_campos_privilegiados()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;  -- superusuario / service_role: sin restriccion
  end if;

  if new.rol is distinct from old.rol and not public.es_admin() then
    raise exception 'No puede cambiar su propio rol.' using errcode = '42501';
  end if;

  if new.verificado is distinct from old.verificado and not public.es_admin() then
    raise exception 'Solo un administrador concede la verificacion.' using errcode = '42501';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists proteger_perfil on public.profiles;
create trigger proteger_perfil
  before update on public.profiles
  for each row execute function public.proteger_campos_privilegiados();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "perfil propio visible" on public.profiles;
create policy "perfil propio visible" on public.profiles
  for select using ((select auth.uid()) = id);

-- Los brokers tienen ficha publica: su nombre y contacto se muestran en cada
-- anuncio. Los perfiles de 'usuario' nunca son publicos.
drop policy if exists "brokers visibles" on public.profiles;
create policy "brokers visibles" on public.profiles
  for select using (rol = 'broker');

drop policy if exists "admin ve todo el padron" on public.profiles;
create policy "admin ve todo el padron" on public.profiles
  for select using (public.es_admin());

drop policy if exists "edicion del perfil propio" on public.profiles;
create policy "edicion del perfil propio" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "admin edita cualquier perfil" on public.profiles;
create policy "admin edita cualquier perfil" on public.profiles
  for update using (public.es_admin()) with check (public.es_admin());
