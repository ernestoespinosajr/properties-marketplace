export type Rol = "usuario" | "broker" | "admin";
export type Operacion = "venta" | "renta";
export type Categoria = "industrial" | "solar" | "local" | "oficina";
export type Disponibilidad = "inmediata" | "30-dias" | "preventa";
export type EstadoAnuncio = "borrador" | "activo" | "pausado" | "vendido" | "oculto";
export type Moneda = "USD" | "MXN" | "DOP";
export type EstadoConsulta = "nueva" | "leida" | "respondida" | "archivada";

export interface Perfil {
  id: string;
  rol: Rol;
  nombre: string;
  telefono: string | null;
  whatsapp: string | null;
  agencia: string | null;
  bio: string | null;
  avatarUrl: string | null;
  verificado: boolean;
}

export interface Sesion {
  email: string;
  perfil: Perfil;
}

export interface Imagen {
  id: string;
  url: string;
  path: string | null;
  alt: string;
  orden: number;
}

export interface PuntoPrecio {
  precio: number;
  moneda: Moneda;
  registradoEn: string;
}

export interface Property {
  id: string;
  slug: string;
  ownerId: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  lat: number | null;
  lng: number | null;
  operacion: Operacion;
  categoria: Categoria;
  disponibilidad: Disponibilidad;
  precio: number;
  moneda: Moneda;
  superficie: number;
  usoSuelo: string;
  antiguedad: number;
  dato: { label: string; valor: string };
  estado: EstadoAnuncio;
  motivoOcultado: string | null;
  destacado: boolean;
  vistas: number;
  creadoEn: string;
  actualizadoEn: string;
  imagenes: Imagen[];
  broker?: Pick<Perfil, "id" | "nombre" | "agencia" | "whatsapp" | "telefono" | "verificado">;
}

export interface Consulta {
  id: string;
  propertyId: string;
  nombre: string;
  email: string;
  telefono: string | null;
  mensaje: string;
  estado: EstadoConsulta;
  creadaEn: string;
  propiedad?: { titulo: string; slug: string };
}

export interface Favorito {
  propiedad: Property;
  precioAlGuardar: number | null;
  monedaAlGuardar: Moneda | null;
  nota: string | null;
  guardadoEn: string;
}

export const CATEGORIAS: { id: Categoria; label: string }[] = [
  { id: "industrial", label: "Logística e Industrial" },
  { id: "solar", label: "Solares Urbanos" },
  { id: "local", label: "Retail y Locales" },
  { id: "oficina", label: "Oficinas Prime" },
];

export const DISPONIBILIDADES: { id: Disponibilidad; label: string }[] = [
  { id: "inmediata", label: "Entrega inmediata" },
  { id: "30-dias", label: "En 30 días" },
  { id: "preventa", label: "Preventa / por desarrollar" },
];

export const ANTIGUEDADES: { id: string; label: string; max: number }[] = [
  { id: "nuevo", label: "A estrenar", max: 0 },
  { id: "5", label: "Hasta 5 años", max: 5 },
  { id: "10", label: "Hasta 10 años", max: 10 },
  { id: "20", label: "Hasta 20 años", max: 20 },
];

export const ESTADOS_ANUNCIO: { id: EstadoAnuncio; label: string; ayuda: string }[] = [
  { id: "borrador", label: "Borrador", ayuda: "Solo usted lo ve. Aún no está publicado." },
  { id: "activo", label: "Publicado", ayuda: "Visible en el marketplace y en las búsquedas." },
  { id: "pausado", label: "Pausado", ayuda: "Retirado del marketplace, se puede reactivar." },
  { id: "vendido", label: "Vendido", ayuda: "Cerrado. Se conserva en su historial." },
  {
    id: "oculto",
    label: "Retirado por un administrador",
    ayuda: "Contacte al equipo de la plataforma.",
  },
];

export const MONEDAS: Moneda[] = ["USD", "MXN", "DOP"];

const LOCALE: Record<Moneda, string> = { USD: "en-US", MXN: "es-MX", DOP: "es-DO" };

export function formatMonto(monto: number, moneda: Moneda) {
  return new Intl.NumberFormat(LOCALE[moneda] ?? "es-MX", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
}

export function formatPrecio(p: Pick<Property, "precio" | "moneda" | "operacion">) {
  const monto = formatMonto(p.precio, p.moneda);
  return p.operacion === "renta" ? `${monto} / mes` : monto;
}

export function precioM2(p: Pick<Property, "precio" | "moneda" | "superficie">) {
  // superficie tiene check (> 0) en la base, pero un borrador a medio llenar
  // puede llegar aquí con 0 antes de guardarse.
  if (!p.superficie) return "—";
  return formatMonto(Math.round(p.precio / p.superficie), p.moneda);
}

export function formatM2(p: Pick<Property, "superficie">) {
  return `${new Intl.NumberFormat("es-MX").format(p.superficie)} m²`;
}

export function formatAntiguedad(p: Pick<Property, "antiguedad">) {
  return p.antiguedad === 0 ? "A estrenar" : `${p.antiguedad} años`;
}

export function labelDisponibilidad(p: Pick<Property, "disponibilidad">) {
  return DISPONIBILIDADES.find((d) => d.id === p.disponibilidad)?.label ?? "";
}

export function labelCategoria(c: Categoria) {
  return CATEGORIAS.find((x) => x.id === c)?.label ?? c;
}

/** La columna de búsqueda guarda los lexemas sin tildes, así que la consulta
 *  tiene que llegar igual o "Tultitlán" no encontraría "Tultitlan". */
export function sinTildes(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
