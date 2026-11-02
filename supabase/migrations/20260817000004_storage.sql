-- ---------------------------------------------------------------------------
-- Bucket de imagenes de propiedades
--
-- Convencion de rutas: {owner_id}/{property_id}/{archivo}
-- La primera carpeta es el uuid del broker, y las policies se apoyan en eso
-- para que nadie escriba dentro de la carpeta de otro.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'propiedades',
  'propiedades',
  true,
  8388608,  -- 8 MB por archivo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos de propiedades son publicas" on storage.objects;
create policy "fotos de propiedades son publicas" on storage.objects
  for select using (bucket_id = 'propiedades');

drop policy if exists "el broker sube a su carpeta" on storage.objects;
create policy "el broker sube a su carpeta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'propiedades'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.puede_publicar()
  );

drop policy if exists "el broker reemplaza en su carpeta" on storage.objects;
create policy "el broker reemplaza en su carpeta" on storage.objects
  for update to authenticated
  using (bucket_id = 'propiedades' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "el broker borra de su carpeta" on storage.objects;
create policy "el broker borra de su carpeta" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'propiedades'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.es_admin())
  );
