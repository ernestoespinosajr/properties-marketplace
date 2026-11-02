# Properties MarketPlace

Marketplace de bienes raíces comerciales: naves industriales, solares, locales y oficinas
en venta y renta.

## Stack

- TanStack Start (React 19, SSR) + Vite
- Supabase (Postgres, Auth y Storage)
- Tailwind CSS v4
- Leaflet + OpenStreetMap para los mapas

## Los tres portales

| Rol         | Entra por                  | Puede                                                                             |
| ----------- | -------------------------- | --------------------------------------------------------------------------------- |
| **usuario** | `/registro?rol=usuario`    | Buscar, guardar propiedades, seguir variaciones de precio, escribir a los brokers |
| **broker**  | `/registro?rol=broker`     | Todo lo del usuario, más publicar y administrar su inventario y recibir consultas |
| **admin**   | No se registra — se asigna | Moderar anuncios, destacar, gestionar cuentas y roles, verificar agencias         |

El rol de administrador **no es autoasignable**. El registro público solo ofrece `usuario`
y `broker`, el trigger `handle_new_user` recorta cualquier otro valor que llegue por la API,
y `proteger_campos_privilegiados` impide que una cuenta se cambie el rol a sí misma. Para
crear el primer admin, tras registrarse normalmente:

```sql
update public.profiles set rol = 'admin' where id = '<uuid del usuario>';
```

en el SQL Editor de Supabase, que corre como superusuario. A partir de ahí, ese admin puede
promover a otros desde `/admin/cuentas`.

## Puesta en marcha

```sh
bun install
cp .env.example .env.local   # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
bun run dev
```

### Base de datos

Las migraciones están en [`supabase/migrations/`](supabase/migrations) y hay que correrlas
**en orden**. La primera (`20260817000000_retirar_v1.sql`) borra el esquema de la versión
anterior, incluidas sus propiedades de demostración.

Con el SQL Editor de Supabase, pegando todo de una vez:

```sh
cat supabase/migrations/*.sql | pbcopy
```

O con el CLI, si el proyecto está enlazado:

```sh
supabase db push
```

Después, [`supabase/seed.sql`](supabase/seed.sql) carga seis propiedades de ejemplo y las
asigna al broker registrado más antiguo. Hay que registrar una cuenta de broker antes de
correrlo; si no hay ninguna, avisa y no hace nada.

El esquema de la primera versión, incluido el modelo de planes que se retiró, queda en
[`supabase/legacy/`](supabase/legacy).

## Notas de diseño

- **Publicación directa.** El broker publica sin revisión previa; el admin modera después
  con el estado `oculto`, que solo él puede poner y quitar.
- **Búsqueda en Postgres.** Filtros, orden y paginación se resuelven en la base, con
  `tsvector` sin tildes e índices por categoría, operación, precio y superficie.
- **Historial de precio.** Un trigger registra cada cambio en `price_history`. Al guardar un
  favorito se congela el precio del momento, y de ahí sale el «bajó X desde que la guardaste»
  del portal del usuario.
- **Ordenar por precio no convierte moneda.** Un listado que mezcle USD, MXN y DOP se ordena
  mal. Mientras no haya tipo de cambio, conviene mantener el inventario en una sola moneda.
- **Un anuncio publicado por un admin no muestra sus datos de contacto**, porque la ficha
  pública de perfil solo alcanza a los `broker`. Es un caso de borde: los admins no publican
  en la operación normal.

## Deploy

Build target: Vercel (nitro preset `vercel`, configurado en `vite.config.ts`).

```sh
bun run build
```

Configurar las mismas variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en Vercel.
