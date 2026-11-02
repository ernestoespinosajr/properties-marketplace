import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/server";
import { requerirSesion, sesionActual } from "./sesion";
import type { Sesion } from "@/lib/tipos";

export const obtenerSesion = createServerFn({ method: "GET" }).handler(
  async (): Promise<Sesion | null> => {
    return sesionActual();
  },
);

const esquemaRegistro = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres").max(72),
  nombre: z.string().trim().min(1, "Indique su nombre").max(100),
  // 'admin' no aparece a propósito: el rol de administrador se asigna a mano en
  // la base de datos. El trigger handle_new_user lo recorta también del lado de
  // Postgres, por si alguien llama a la API de Supabase sin pasar por aquí.
  rol: z.enum(["usuario", "broker"]),
  telefono: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  agencia: z.string().trim().max(120).optional(),
});

export type ResultadoAuth = { ok: true } | { ok: false; error: string };

export const registrarse = createServerFn({ method: "POST" })
  .validator(esquemaRegistro)
  .handler(async ({ data }): Promise<ResultadoAuth> => {
    const supabase = clienteServidor();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nombre: data.nombre,
          rol: data.rol,
          telefono: data.telefono ?? "",
          whatsapp: data.whatsapp ?? "",
          agencia: data.agencia ?? "",
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        return { ok: false, error: "Ya existe una cuenta con ese correo." };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true };
  });

export const iniciarSesion = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().trim().email("Correo inválido").max(255),
      password: z.string().min(1, "Escriba su contraseña").max(72),
    }),
  )
  .handler(async ({ data }): Promise<ResultadoAuth> => {
    const supabase = clienteServidor();
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      // Supabase no distingue correo inexistente de contraseña incorrecta, y
      // está bien que así sea: revelarlo permitiría sondear qué correos existen.
      return { ok: false, error: "Correo o contraseña incorrectos." };
    }
    return { ok: true };
  });

export const cerrarSesion = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = clienteServidor();
  await supabase.auth.signOut();
  return { ok: true as const };
});

export const actualizarPerfil = createServerFn({ method: "POST" })
  .validator(
    z.object({
      nombre: z.string().trim().min(1, "Indique su nombre").max(100),
      telefono: z.string().trim().max(40).optional(),
      whatsapp: z.string().trim().max(40).optional(),
      agencia: z.string().trim().max(120).optional(),
      bio: z.string().trim().max(600).optional(),
    }),
  )
  .handler(async ({ data }): Promise<ResultadoAuth> => {
    const sesion = await requerirSesion();
    const supabase = clienteServidor();
    // rol y verificado no se envían: el trigger proteger_campos_privilegiados
    // rechazaría la actualización entera si viniesen alterados.
    const { error } = await supabase
      .from("profiles")
      .update({
        nombre: data.nombre,
        telefono: data.telefono || null,
        whatsapp: data.whatsapp || null,
        agencia: data.agencia || null,
        bio: data.bio || null,
      })
      .eq("id", sesion.perfil.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });
