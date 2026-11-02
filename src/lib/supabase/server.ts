import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Cliente para el servidor. Lee y escribe la sesión en las cookies de la
 * petición en curso, así que hay que crear uno nuevo por petición — nunca
 * guardarlo en un módulo, o una petición acabaría respondiendo con la sesión de
 * otra.
 *
 * Solo puede usarse dentro de una server function o del handler de SSR:
 * getCookies() depende del contexto de petición de TanStack Start.
 */
export function clienteServidor() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, options);
        }
      },
    },
  });
}
