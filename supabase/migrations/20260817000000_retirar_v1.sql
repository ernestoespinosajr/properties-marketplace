-- ---------------------------------------------------------------------------
-- Retirar el esquema v1
--
-- ATENCION: esta migracion BORRA las tablas de la primera version, incluidas
-- las 6 propiedades de demostracion. Es contenido del seed del repositorio, no
-- inventario real; queda recuperable en supabase/legacy/seed-v1.sql.
--
-- Va primero a proposito. Las migraciones siguientes crean 'properties' con un
-- esquema incompatible (id uuid, owner_id, estado...) y un "create table if not
-- exists" sobre la tabla vieja no haria nada: dejaria el esquema v1 en su sitio
-- y todo lo demas fallaria mas adelante y de forma confusa.
--
-- Se descarta ademas el modelo de planes en esta etapa. Su esquema queda en
-- supabase/legacy/schema-v1.sql por si vuelve mas adelante.
-- ---------------------------------------------------------------------------

drop table if exists public.leads cascade;
drop table if exists public.plans cascade;
drop table if exists public.properties cascade;
