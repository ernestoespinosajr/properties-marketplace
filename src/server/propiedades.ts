import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/server";
import { requerirRol, requerirSesion, sesionActual } from "./sesion";
import { esquemaPropiedad } from "@/lib/esquemas";
import { ANTIGUEDADES, sinTildes, type Imagen, type Property, type PuntoPrecio } from "@/lib/tipos";

export const POR_PAGINA = 12;

const SELECT_PUBLICO = `
  id, slug, owner_id, titulo, descripcion, ubicacion, lat, lng, operacion, categoria,
  disponibilidad, precio, moneda, superficie, uso_suelo, antiguedad, dato_label, dato_valor,
  estado, motivo_ocultado, destacado, vistas, created_at, updated_at,
  imagenes:property_images(id, url, path, alt, orden),
  broker:profiles!properties_owner_id_fkey(id, nombre, agencia, whatsapp, telefono, verificado)
`;

interface FilaPropiedad {
  id: string;
  slug: string;
  owner_id: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  lat: number | null;
  lng: number | null;
  operacion: Property["operacion"];
  categoria: Property["categoria"];
  disponibilidad: Property["disponibilidad"];
  precio: number;
  moneda: Property["moneda"];
  superficie: number;
  uso_suelo: string;
  antiguedad: number;
  dato_label: string;
  dato_valor: string;
  estado: Property["estado"];
  motivo_ocultado: string | null;
  destacado: boolean;
  vistas: number;
  created_at: string;
  updated_at: string;
  imagenes?: { id: string; url: string; path: string | null; alt: string; orden: number }[] | null;
  broker?: Property["broker"] | null;
}

function aPropiedad(fila: FilaPropiedad): Property {
  const imagenes: Imagen[] = (fila.imagenes ?? [])
    .map((i) => ({ id: i.id, url: i.url, path: i.path, alt: i.alt, orden: i.orden }))
    .sort((a, b) => a.orden - b.orden);

  return {
    id: fila.id,
    slug: fila.slug,
    ownerId: fila.owner_id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    ubicacion: fila.ubicacion,
    lat: fila.lat,
    lng: fila.lng,
    operacion: fila.operacion,
    categoria: fila.categoria,
    disponibilidad: fila.disponibilidad,
    precio: fila.precio,
    moneda: fila.moneda,
    superficie: fila.superficie,
    usoSuelo: fila.uso_suelo,
    antiguedad: fila.antiguedad,
    dato: { label: fila.dato_label, valor: fila.dato_valor },
    estado: fila.estado,
    motivoOcultado: fila.motivo_ocultado,
    destacado: fila.destacado,
    vistas: fila.vistas,
    creadoEn: fila.created_at,
    actualizadoEn: fila.updated_at,
    imagenes,
    broker: fila.broker ?? undefined,
  };
}

export const filtrosBusqueda = z.object({
  pagina: z.number().int().min(1).catch(1),
  categoria: z.enum(["industrial", "solar", "local", "oficina"]).optional(),
  operacion: z.enum(["venta", "renta"]).optional(),
  q: z.string().trim().max(80).optional(),
  precioMin: z.number().positive().optional(),
  precioMax: z.number().positive().optional(),
  m2Min: z.number().positive().optional(),
  m2Max: z.number().positive().optional(),
  disponibilidad: z.enum(["inmediata", "30-dias", "preventa"]).optional(),
  antiguedad: z.string().optional(),
  orden: z.string().optional(),
});

export type FiltrosBusqueda = z.infer<typeof filtrosBusqueda>;

export interface PaginaPropiedades {
  items: Property[];
  total: number;
  pagina: number;
  paginas: number;
}

/**
 * Listado público.
 *
 * Filtros, orden y paginación se resuelven en Postgres: la versión anterior
 * traía la tabla entera y filtraba en el navegador, lo que dejaba de funcionar
 * en cuanto el inventario creciera.
 *
 * Nota conocida: el orden por precio compara números sin convertir moneda, así
 * que mezclar USD y MXN en un mismo listado ordena mal. Mientras no haya tipo
 * de cambio, conviene filtrar por moneda o mantener el inventario en una sola.
 */
export const listarPropiedades = createServerFn({ method: "GET" })
  .validator(filtrosBusqueda)
  .handler(async ({ data }): Promise<PaginaPropiedades> => {
    const supabase = clienteServidor();
    let consulta = supabase
      .from("properties")
      .select(SELECT_PUBLICO, { count: "exact" })
      .eq("estado", "activo");

    if (data.categoria) consulta = consulta.eq("categoria", data.categoria);
    if (data.operacion) consulta = consulta.eq("operacion", data.operacion);
    if (data.disponibilidad) consulta = consulta.eq("disponibilidad", data.disponibilidad);
    if (data.precioMin) consulta = consulta.gte("precio", data.precioMin);
    if (data.precioMax) consulta = consulta.lte("precio", data.precioMax);
    if (data.m2Min) consulta = consulta.gte("superficie", data.m2Min);
    if (data.m2Max) consulta = consulta.lte("superficie", data.m2Max);

    const maxAntiguedad = ANTIGUEDADES.find((a) => a.id === data.antiguedad)?.max;
    if (maxAntiguedad !== undefined) consulta = consulta.lte("antiguedad", maxAntiguedad);

    if (data.q) {
      consulta = consulta.textSearch("busqueda", sinTildes(data.q), {
        type: "websearch",
        config: "spanish",
      });
    }

    switch (data.orden) {
      case "precio-asc":
        consulta = consulta.order("precio", { ascending: true });
        break;
      case "precio-desc":
        consulta = consulta.order("precio", { ascending: false });
        break;
      case "m2-desc":
        consulta = consulta.order("superficie", { ascending: false });
        break;
      case "m2-precio":
        consulta = consulta.order("precio_m2", { ascending: true });
        break;
      case "antiguedad-asc":
        consulta = consulta.order("antiguedad", { ascending: true });
        break;
      default:
        consulta = consulta
          .order("destacado", { ascending: false })
          .order("created_at", { ascending: false });
    }

    const desde = (data.pagina - 1) * POR_PAGINA;
    const { data: filas, count, error } = await consulta.range(desde, desde + POR_PAGINA - 1);
    if (error) throw error;

    const total = count ?? 0;
    return {
      items: (filas as unknown as FilaPropiedad[]).map(aPropiedad),
      total,
      pagina: data.pagina,
      paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    };
  });

export const propiedadesDestacadas = createServerFn({ method: "GET" }).handler(
  async (): Promise<Property[]> => {
    const supabase = clienteServidor();
    const { data, error } = await supabase
      .from("properties")
      .select(SELECT_PUBLICO)
      .eq("estado", "activo")
      .order("destacado", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw error;
    return (data as unknown as FilaPropiedad[]).map(aPropiedad);
  },
);

export interface DetallePropiedad {
  propiedad: Property;
  historial: PuntoPrecio[];
  similares: Property[];
  favorita: boolean;
}

export const obtenerPropiedad = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }): Promise<DetallePropiedad | null> => {
    const supabase = clienteServidor();
    const { data: fila, error } = await supabase
      .from("properties")
      .select(SELECT_PUBLICO)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    if (!fila) return null;

    const propiedad = aPropiedad(fila as unknown as FilaPropiedad);
    const sesion = await sesionActual();

    const [historial, similares, favorita] = await Promise.all([
      supabase
        .from("price_history")
        .select("precio, moneda, registrado_en")
        .eq("property_id", propiedad.id)
        .order("registrado_en", { ascending: true })
        .then(({ data: h }) =>
          (h ?? []).map((p) => ({
            precio: p.precio as number,
            moneda: p.moneda as Property["moneda"],
            registradoEn: p.registrado_en as string,
          })),
        ),
      supabase
        .from("properties")
        .select(SELECT_PUBLICO)
        .eq("estado", "activo")
        .eq("categoria", propiedad.categoria)
        .neq("id", propiedad.id)
        .limit(3)
        .then(({ data: s }) => ((s as unknown as FilaPropiedad[] | null) ?? []).map(aPropiedad)),
      sesion
        ? supabase
            .from("favorites")
            .select("property_id")
            .eq("user_id", sesion.perfil.id)
            .eq("property_id", propiedad.id)
            .maybeSingle()
            .then(({ data: f }) => Boolean(f))
        : Promise.resolve(false),
    ]);

    // Hay que esperarlo: sin await la petición puede terminar antes de que
    // salga el RPC y el contador se queda en cero. El catch lo deja informativo
    // y no transaccional -- si falla, la ficha se sirve igual.
    await supabase.rpc("incrementar_vistas", { propiedad: propiedad.id }).then(({ error }) => {
      if (error) console.error("No se pudo contar la vista:", error.message);
    });

    return { propiedad, historial, similares, favorita };
  });

// ---------------------------------------------------------------------------
// Inventario del broker
// ---------------------------------------------------------------------------

export const misPropiedades = createServerFn({ method: "GET" }).handler(
  async (): Promise<Property[]> => {
    const sesion = await requerirRol("broker", "admin");
    const supabase = clienteServidor();
    const { data, error } = await supabase
      .from("properties")
      .select(SELECT_PUBLICO)
      .eq("owner_id", sesion.perfil.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as FilaPropiedad[]).map(aPropiedad);
  },
);

export const obtenerMiPropiedad = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<Property | null> => {
    const sesion = await requerirRol("broker", "admin");
    const supabase = clienteServidor();
    const { data: fila, error } = await supabase
      .from("properties")
      .select(SELECT_PUBLICO)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!fila) return null;
    const propiedad = aPropiedad(fila as unknown as FilaPropiedad);
    if (propiedad.ownerId !== sesion.perfil.id && sesion.perfil.rol !== "admin") return null;
    return propiedad;
  });

export type ResultadoGuardado =
  { ok: true; id: string; slug: string } | { ok: false; error: string };

export const guardarPropiedad = createServerFn({ method: "POST" })
  .validator(esquemaPropiedad)
  .handler(async ({ data }): Promise<ResultadoGuardado> => {
    const sesion = await requerirRol("broker", "admin");
    const supabase = clienteServidor();

    const fila = {
      titulo: data.titulo,
      descripcion: data.descripcion,
      ubicacion: data.ubicacion,
      lat: data.lat,
      lng: data.lng,
      operacion: data.operacion,
      categoria: data.categoria,
      disponibilidad: data.disponibilidad,
      precio: data.precio,
      moneda: data.moneda,
      superficie: data.superficie,
      uso_suelo: data.usoSuelo,
      antiguedad: data.antiguedad,
      dato_label: data.datoLabel,
      dato_valor: data.datoValor,
      estado: data.estado,
    };

    if (data.id) {
      const { data: actualizada, error } = await supabase
        .from("properties")
        .update(fila)
        .eq("id", data.id)
        .select("id, slug")
        .maybeSingle();
      if (error) return { ok: false, error: error.message };
      if (!actualizada)
        return { ok: false, error: "No encontramos esa propiedad en su inventario." };
      return { ok: true, id: actualizada.id as string, slug: actualizada.slug as string };
    }

    const { data: creada, error } = await supabase
      .from("properties")
      .insert({ ...fila, owner_id: sesion.perfil.id })
      .select("id, slug")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!creada) return { ok: false, error: "No pudimos crear la propiedad." };
    return { ok: true, id: creada.id as string, slug: creada.slug as string };
  });

export const cambiarEstadoPropiedad = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      estado: z.enum(["borrador", "activo", "pausado", "vendido"]),
    }),
  )
  .handler(async ({ data }) => {
    await requerirRol("broker", "admin");
    const supabase = clienteServidor();
    const { error } = await supabase
      .from("properties")
      .update({ estado: data.estado })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const eliminarPropiedad = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requerirRol("broker", "admin");
    const supabase = clienteServidor();
    const { error } = await supabase.from("properties").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Galería
// ---------------------------------------------------------------------------

export const registrarImagen = createServerFn({ method: "POST" })
  .validator(
    z.object({
      propertyId: z.string().uuid(),
      url: z.string().url().max(600),
      path: z.string().max(400),
      alt: z.string().trim().max(160).default(""),
    }),
  )
  .handler(async ({ data }) => {
    await requerirRol("broker", "admin");
    const supabase = clienteServidor();
    const { count } = await supabase
      .from("property_images")
      .select("id", { count: "exact", head: true })
      .eq("property_id", data.propertyId);

    const { error } = await supabase.from("property_images").insert({
      property_id: data.propertyId,
      url: data.url,
      path: data.path,
      alt: data.alt,
      orden: count ?? 0,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const eliminarImagen = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requerirRol("broker", "admin");
    const supabase = clienteServidor();

    const { data: imagen } = await supabase
      .from("property_images")
      .select("path")
      .eq("id", data.id)
      .maybeSingle();

    const { error } = await supabase.from("property_images").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };

    // El binario se borra después de la fila: si esto falla queda un archivo
    // huérfano en el bucket, que es preferible a una fila apuntando a una
    // imagen que ya no existe.
    if (imagen?.path) {
      await supabase.storage.from("propiedades").remove([imagen.path as string]);
    }
    return { ok: true as const };
  });

export const reordenarImagenes = createServerFn({ method: "POST" })
  .validator(z.object({ ids: z.array(z.string().uuid()).max(40) }))
  .handler(async ({ data }) => {
    await requerirSesion();
    const supabase = clienteServidor();
    await Promise.all(
      data.ids.map((id, orden) => supabase.from("property_images").update({ orden }).eq("id", id)),
    );
    return { ok: true as const };
  });
