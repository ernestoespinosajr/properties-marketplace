import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/server";
import { requerirSesion } from "./sesion";
import type { Favorito, Moneda, Property } from "@/lib/tipos";

const SELECT_FAVORITO = `
  precio_al_guardar, moneda_al_guardar, nota, created_at,
  propiedad:properties!favorites_property_id_fkey(
    id, slug, owner_id, titulo, descripcion, ubicacion, lat, lng, operacion, categoria,
    disponibilidad, precio, moneda, superficie, uso_suelo, antiguedad, dato_label, dato_valor,
    estado, motivo_ocultado, destacado, vistas, created_at, updated_at,
    imagenes:property_images(id, url, path, alt, orden),
    broker:profiles!properties_owner_id_fkey(id, nombre, agencia, whatsapp, telefono, verificado)
  )
`;

export const misFavoritos = createServerFn({ method: "GET" }).handler(
  async (): Promise<Favorito[]> => {
    const sesion = await requerirSesion();
    const supabase = clienteServidor();
    const { data, error } = await supabase
      .from("favorites")
      .select(SELECT_FAVORITO)
      .eq("user_id", sesion.perfil.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return (data ?? [])
      .filter((f) => f.propiedad)
      .map((f) => {
        const p = f.propiedad as unknown as Record<string, unknown>;
        const imagenes = ((p.imagenes as Property["imagenes"]) ?? [])
          .slice()
          .sort((a, b) => a.orden - b.orden);
        return {
          precioAlGuardar: (f.precio_al_guardar as number | null) ?? null,
          monedaAlGuardar: (f.moneda_al_guardar as Moneda | null) ?? null,
          nota: (f.nota as string | null) ?? null,
          guardadoEn: f.created_at as string,
          propiedad: {
            id: p.id as string,
            slug: p.slug as string,
            ownerId: p.owner_id as string,
            titulo: p.titulo as string,
            descripcion: p.descripcion as string,
            ubicacion: p.ubicacion as string,
            lat: (p.lat as number | null) ?? null,
            lng: (p.lng as number | null) ?? null,
            operacion: p.operacion as Property["operacion"],
            categoria: p.categoria as Property["categoria"],
            disponibilidad: p.disponibilidad as Property["disponibilidad"],
            precio: p.precio as number,
            moneda: p.moneda as Moneda,
            superficie: p.superficie as number,
            usoSuelo: p.uso_suelo as string,
            antiguedad: p.antiguedad as number,
            dato: { label: p.dato_label as string, valor: p.dato_valor as string },
            estado: p.estado as Property["estado"],
            motivoOcultado: (p.motivo_ocultado as string | null) ?? null,
            destacado: p.destacado as boolean,
            vistas: p.vistas as number,
            creadoEn: p.created_at as string,
            actualizadoEn: p.updated_at as string,
            imagenes,
            broker: (p.broker as Property["broker"]) ?? undefined,
          },
        };
      });
  },
);

export const alternarFavorito = createServerFn({ method: "POST" })
  .validator(z.object({ propertyId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const sesion = await requerirSesion();
    const supabase = clienteServidor();

    const { data: existente } = await supabase
      .from("favorites")
      .select("property_id")
      .eq("user_id", sesion.perfil.id)
      .eq("property_id", data.propertyId)
      .maybeSingle();

    if (existente) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", sesion.perfil.id)
        .eq("property_id", data.propertyId);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, favorita: false };
    }

    // precio_al_guardar lo rellena el trigger congelar_precio con el precio
    // vigente, que es lo que después permite calcular la variación.
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: sesion.perfil.id, property_id: data.propertyId });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, favorita: true };
  });

export const anotarFavorito = createServerFn({ method: "POST" })
  .validator(z.object({ propertyId: z.string().uuid(), nota: z.string().trim().max(400) }))
  .handler(async ({ data }) => {
    const sesion = await requerirSesion();
    const supabase = clienteServidor();
    const { error } = await supabase
      .from("favorites")
      .update({ nota: data.nota || null })
      .eq("user_id", sesion.perfil.id)
      .eq("property_id", data.propertyId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Solo los ids, para marcar el corazón en listados sin traer cada propiedad
 *  otra vez. Devuelve vacío si no hay sesión, en vez de fallar: el listado es
 *  público y tiene que servirse igual a un visitante anónimo. */
export const idsFavoritos = createServerFn({ method: "GET" }).handler(
  async (): Promise<string[]> => {
    const supabase = clienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase.from("favorites").select("property_id").eq("user_id", user.id);
    return (data ?? []).map((f) => f.property_id as string);
  },
);
