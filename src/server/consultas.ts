import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/server";
import { requerirRol, requerirSesion } from "./sesion";
import type { Consulta } from "@/lib/tipos";

interface FilaConsulta {
  id: string;
  property_id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  mensaje: string;
  estado: Consulta["estado"];
  created_at: string;
  propiedad?: { titulo: string; slug: string } | null;
}

function aConsulta(fila: FilaConsulta): Consulta {
  return {
    id: fila.id,
    propertyId: fila.property_id,
    nombre: fila.nombre,
    email: fila.email,
    telefono: fila.telefono,
    mensaje: fila.mensaje,
    estado: fila.estado,
    creadaEn: fila.created_at,
    propiedad: fila.propiedad ?? undefined,
  };
}

const SELECT_CONSULTA = `
  id, property_id, nombre, email, telefono, mensaje, estado, created_at,
  propiedad:properties(titulo, slug)
`;

export const enviarConsulta = createServerFn({ method: "POST" })
  .validator(
    z.object({
      propertyId: z.string().uuid(),
      nombre: z.string().trim().min(1, "Indique su nombre").max(100),
      email: z.string().trim().email("Correo inválido").max(255),
      telefono: z.string().trim().max(40).optional(),
      mensaje: z.string().trim().max(1200).default(""),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = clienteServidor();
    // broker_id y user_id no se envían: los pone el trigger
    // asignar_broker_consulta a partir del anuncio. Si viajaran en el formulario
    // cualquiera podría dirigir consultas a la bandeja de otro broker.
    const { error } = await supabase.from("inquiries").insert({
      property_id: data.propertyId,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono || null,
      mensaje: data.mensaje,
    });
    if (error) {
      return { ok: false as const, error: "No pudimos enviar su consulta. Intente de nuevo." };
    }
    return { ok: true as const };
  });

export const consultasRecibidas = createServerFn({ method: "GET" }).handler(
  async (): Promise<Consulta[]> => {
    const sesion = await requerirRol("broker", "admin");
    const supabase = clienteServidor();
    const { data, error } = await supabase
      .from("inquiries")
      .select(SELECT_CONSULTA)
      .eq("broker_id", sesion.perfil.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as FilaConsulta[]).map(aConsulta);
  },
);

export const consultasEnviadas = createServerFn({ method: "GET" }).handler(
  async (): Promise<Consulta[]> => {
    const sesion = await requerirSesion();
    const supabase = clienteServidor();
    const { data, error } = await supabase
      .from("inquiries")
      .select(SELECT_CONSULTA)
      .eq("user_id", sesion.perfil.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as FilaConsulta[]).map(aConsulta);
  },
);

export const marcarConsulta = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      estado: z.enum(["nueva", "leida", "respondida", "archivada"]),
    }),
  )
  .handler(async ({ data }) => {
    await requerirRol("broker", "admin");
    const supabase = clienteServidor();
    const { error } = await supabase
      .from("inquiries")
      .update({ estado: data.estado })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
