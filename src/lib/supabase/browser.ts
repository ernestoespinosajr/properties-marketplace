import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let cliente: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Cliente para el navegador. A diferencia del de servidor sí es un singleton:
 * hay una sola sesión por pestaña, y crear varios duplicaría los listeners de
 * refresco del token.
 *
 * Se usa para lo que tiene que ocurrir sin pasar por el servidor: subir
 * imágenes a Storage y reaccionar a cambios de sesión.
 */
export function clienteNavegador() {
  cliente ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cliente;
}
