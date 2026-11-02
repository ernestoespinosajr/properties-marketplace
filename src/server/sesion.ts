import { clienteServidor } from "@/lib/supabase/server";
import type { Perfil, Rol, Sesion } from "@/lib/tipos";

/**
 * Helpers de sesión que corren en el servidor pero NO son server functions.
 *
 * Viven separados de auth.ts a propósito. TanStack Start elimina del bundle del
 * cliente el cuerpo de los `createServerFn().handler(...)`, pero no el de una
 * función exportada normal. Mientras estas convivían con las server functions,
 * el módulo entero — y con él el cliente de Supabase con las cookies de la
 * petición — quedaba enganchado al grafo del navegador y saltaba la
 * import-protection.
 *
 * Regla: esto solo puede importarse desde otros módulos de src/server/.
 */

interface FilaPerfil {
  id: string;
  rol: Rol;
  nombre: string;
  telefono: string | null;
  whatsapp: string | null;
  agencia: string | null;
  bio: string | null;
  avatar_url: string | null;
  verificado: boolean;
}

export function aPerfil(fila: FilaPerfil): Perfil {
  return {
    id: fila.id,
    rol: fila.rol,
    nombre: fila.nombre,
    telefono: fila.telefono,
    whatsapp: fila.whatsapp,
    agencia: fila.agencia,
    bio: fila.bio,
    avatarUrl: fila.avatar_url,
    verificado: fila.verificado,
  };
}

export const CAMPOS_PERFIL =
  "id, rol, nombre, telefono, whatsapp, agencia, bio, avatar_url, verificado";

/**
 * Sesión del servidor.
 *
 * Usa getUser() y no getSession(): getSession() se limita a decodificar la
 * cookie, que el cliente controla, mientras que getUser() valida el token
 * contra Supabase. Para decidir permisos hace falta lo segundo.
 */
export async function sesionActual(): Promise<Sesion | null> {
  const supabase = clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(CAMPOS_PERFIL)
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  return { email: user.email ?? "", perfil: aPerfil(data as FilaPerfil) };
}

/** Para usar dentro de otras server functions: corta si no hay sesión. */
export async function requerirSesion(): Promise<Sesion> {
  const sesion = await sesionActual();
  if (!sesion) throw new Error("Necesita iniciar sesión para continuar.");
  return sesion;
}

export async function requerirRol(...roles: Rol[]): Promise<Sesion> {
  const sesion = await requerirSesion();
  if (!roles.includes(sesion.perfil.rol)) {
    throw new Error("Su cuenta no tiene permiso para esta acción.");
  }
  return sesion;
}
