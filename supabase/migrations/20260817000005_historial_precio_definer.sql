-- ---------------------------------------------------------------------------
-- El trigger del historial de precio necesita SECURITY DEFINER
--
-- price_history tiene RLS con una unica policy de select: el historial es de
-- solo lectura para todo el mundo, porque debe escribirlo el trigger y nadie
-- mas. Pero sin SECURITY DEFINER el trigger corre con los permisos de quien
-- hace el UPDATE, y RLS le bloquea su propio insert:
--
--   new row violates row-level security policy for table "price_history"
--
-- Publicar cualquier propiedad fallaba por esto. La alternativa -- abrir una
-- policy de insert -- dejaria que un broker falsificara el historial de precios
-- de su anuncio, que es justo el dato en el que se apoya el seguimiento del
-- portal del usuario.
-- ---------------------------------------------------------------------------

create or replace function public.registrar_precio()
returns trigger
language plpgsql
security definer
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
