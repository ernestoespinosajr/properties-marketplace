import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/server";
import { CAMPOS_PERFIL, aPerfil, requerirRol } from "./sesion";
import type { Perfil, Property } from "@/lib/tipos";

const SELECT_ADMIN = `
  id, slug, owner_id, titulo, descripcion, ubicacion, lat, lng, operacion, categoria,
  disponibilidad, precio, moneda, superficie, uso_suelo, antiguedad, dato_label, dato_valor,
  estado, motivo_ocultado, destacado, vistas, created_at, updated_at,
  imagenes:property_images(id, url, path, alt, orden),
  broker:profiles!properties_owner_id_fkey(id, nombre, agencia, whatsapp, telefono, verificado)
`;

export interface ResumenAdmin {
  anuncios: { total: number; activos: number; ocultos: number; borradores: number };
  cuentas: { total: number; brokers: number; usuarios: number; sinVerificar: number };
  consultas: { total: number; nuevas: number };
}

export const resumenAdmin = createServerFn({ method: "GET" }).handler(
  async (): Promise<ResumenAdmin> => {
    await requerirRol("admin");
    const supabase = clienteServidor();

    const contarPropiedades = async (estado?: string) => {
      let q = supabase.from("properties").select("*", { count: "exact", head: true });
      if (estado) q = q.eq("estado", estado);
      const { count } = await q;
      return count ?? 0;
    };

    const contarPerfiles = async (rol?: string, verificado?: boolean) => {
      let q = supabase.from("profiles").select("*", { count: "exact", head: true });
      if (rol) q = q.eq("rol", rol);
      if (verificado !== undefined) q = q.eq("verificado", verificado);
      const { count } = await q;
      return count ?? 0;
    };

    const contarConsultas = async (estado?: string) => {
      let q = supabase.from("inquiries").select("*", { count: "exact", head: true });
      if (estado) q = q.eq("estado", estado);
      const { count } = await q;
      return count ?? 0;
    };

    const [
      total,
      activos,
      ocultos,
      borradores,
      cuentas,
      brokers,
      usuarios,
      sinVerificar,
      consultas,
      nuevas,
    ] = await Promise.all([
      contarPropiedades(),
      contarPropiedades("activo"),
      contarPropiedades("oculto"),
      contarPropiedades("borrador"),
      contarPerfiles(),
      contarPerfiles("broker"),
      contarPerfiles("usuario"),
      contarPerfiles("broker", false),
      contarConsultas(),
      contarConsultas("nueva"),
    ]);

    return {
      anuncios: { total, activos, ocultos, borradores },
      cuentas: { total: cuentas, brokers, usuarios, sinVerificar },
      consultas: { total: consultas, nuevas },
    };
  },
);

export const listarTodoElInventario = createServerFn({ method: "GET" })
  .validator(
    z.object({
      estado: z
        .enum(["todos", "borrador", "activo", "pausado", "vendido", "oculto"])
        .catch("todos"),
      q: z.string().trim().max(80).optional(),
    }),
  )
  .handler(async ({ data }): Promise<Property[]> => {
    await requerirRol("admin");
    const supabase = clienteServidor();
    let consulta = supabase
      .from("properties")
      .select(SELECT_ADMIN)
      .order("created_at", { ascending: false });
    if (data.estado !== "todos") consulta = consulta.eq("estado", data.estado);
    if (data.q) consulta = consulta.ilike("titulo", `%${data.q}%`);

    const { data: filas, error } = await consulta.limit(200);
    if (error) throw error;

    return (filas as unknown as Record<string, unknown>[]).map((p) => ({
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
      moneda: p.moneda as Property["moneda"],
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
      imagenes: ((p.imagenes as Property["imagenes"]) ?? [])
        .slice()
        .sort((a, b) => a.orden - b.orden),
      broker: (p.broker as Property["broker"]) ?? undefined,
    }));
  });

/** Moderación posterior: el anuncio ya estaba publicado y el admin lo retira. */
export const moderarAnuncio = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      ocultar: z.boolean(),
      motivo: z.string().trim().max(300).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requerirRol("admin");
    const supabase = clienteServidor();
    const { error } = await supabase
      .from("properties")
      .update(
        data.ocultar
          ? {
              estado: "oculto",
              motivo_ocultado: data.motivo || "Retirado por incumplir las normas de publicación.",
            }
          : { estado: "activo", motivo_ocultado: null },
      )
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const destacarAnuncio = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), destacado: z.boolean() }))
  .handler(async ({ data }) => {
    await requerirRol("admin");
    const supabase = clienteServidor();
    const { error } = await supabase
      .from("properties")
      .update({ destacado: data.destacado })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export interface CuentaAdmin extends Perfil {
  anuncios: number;
  creadaEn: string;
}

export const listarCuentas = createServerFn({ method: "GET" })
  .validator(z.object({ rol: z.enum(["todos", "usuario", "broker", "admin"]).catch("todos") }))
  .handler(async ({ data }): Promise<CuentaAdmin[]> => {
    await requerirRol("admin");
    const supabase = clienteServidor();

    let consulta = supabase
      .from("profiles")
      .select(`${CAMPOS_PERFIL}, created_at, anuncios:properties!properties_owner_id_fkey(count)`)
      .order("created_at", { ascending: false });
    if (data.rol !== "todos") consulta = consulta.eq("rol", data.rol);

    const { data: filas, error } = await consulta.limit(300);
    if (error) throw error;

    return (filas as unknown as Record<string, unknown>[]).map((f) => ({
      ...aPerfil(f as never),
      creadaEn: f.created_at as string,
      anuncios: ((f.anuncios as { count: number }[] | null) ?? [{ count: 0 }])[0]?.count ?? 0,
    }));
  });

export const cambiarRol = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), rol: z.enum(["usuario", "broker", "admin"]) }))
  .handler(async ({ data }) => {
    const sesion = await requerirRol("admin");

    // Un admin que se degrada a sí mismo perdería el acceso al panel en el acto,
    // y si fuera el único quedaría la plataforma sin administrador. El cambio
    // tiene que venir de otra cuenta admin.
    if (data.id === sesion.perfil.id && data.rol !== "admin") {
      return { ok: false as const, error: "No puede quitarse a sí mismo el rol de administrador." };
    }

    const supabase = clienteServidor();
    const { error } = await supabase.from("profiles").update({ rol: data.rol }).eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const verificarBroker = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), verificado: z.boolean() }))
  .handler(async ({ data }) => {
    await requerirRol("admin");
    const supabase = clienteServidor();
    const { error } = await supabase
      .from("profiles")
      .update({ verificado: data.verificado })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
