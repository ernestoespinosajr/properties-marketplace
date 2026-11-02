import { redirect } from "@tanstack/react-router";
import type { Sesion } from "./tipos";

export const PESTANAS_ADMIN = [
  { to: "/admin", label: "Resumen" },
  { to: "/admin/anuncios", search: { estado: "todos" }, label: "Anuncios" },
  { to: "/admin/cuentas", search: { rol: "todos" }, label: "Cuentas" },
];

/**
 * Guarda compartida por las tres rutas de administración.
 *
 * El rol admin no se obtiene desde el registro público: lo asigna otro admin
 * desde /admin/cuentas o se pone a mano en la base de datos. Un usuario que
 * llegue aquí sin serlo se va al inicio, no a una pantalla de error, porque
 * para él estas rutas simplemente no existen.
 */
export function soloAdmin(sesion: Sesion | null, volver: string) {
  if (!sesion) throw redirect({ to: "/entrar", search: { volver } });
  if (sesion.perfil.rol !== "admin") throw redirect({ to: "/" });
}
