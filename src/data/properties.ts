import { supabase } from "@/lib/supabase";

export type Operacion = "venta" | "renta";
export type Categoria = "industrial" | "solar" | "local" | "oficina";
export type Disponibilidad = "inmediata" | "30-dias" | "preventa";

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

export const CATEGORIAS: { id: Categoria | "todos"; label: string }[] = [
  { id: "todos", label: "Todos los activos" },
  { id: "industrial", label: "Logística e Industrial" },
  { id: "solar", label: "Solares Urbanos" },
  { id: "local", label: "Retail y Locales" },
  { id: "oficina", label: "Oficinas Prime" },
];

export interface Property {
  id: string;
  titulo: string;
  ubicacion: string;
  operacion: Operacion;
  categoria: Categoria;
  precio: number;
  superficie: number;
  usoSuelo: string;
  disponibilidad: Disponibilidad;
  /** Años de antigüedad del inmueble. 0 = a estrenar / por desarrollar. */
  antiguedad: number;
  dato: { label: string; valor: string };
  imagen: string;
  descripcion: string;
}

interface PropertyRow {
  id: string;
  titulo: string;
  ubicacion: string;
  operacion: Operacion;
  categoria: Categoria;
  precio: number;
  superficie: number;
  uso_suelo: string;
  disponibilidad: Disponibilidad;
  antiguedad: number;
  dato_label: string;
  dato_valor: string;
  imagen: string;
  descripcion: string;
}

function fromRow(row: PropertyRow): Property {
  return {
    id: row.id,
    titulo: row.titulo,
    ubicacion: row.ubicacion,
    operacion: row.operacion,
    categoria: row.categoria,
    precio: row.precio,
    superficie: row.superficie,
    usoSuelo: row.uso_suelo,
    disponibilidad: row.disponibilidad,
    antiguedad: row.antiguedad,
    dato: { label: row.dato_label, valor: row.dato_valor },
    imagen: row.imagen,
    descripcion: row.descripcion,
  };
}

export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as PropertyRow[]).map(fromRow);
}

export async function fetchPropertyById(id: string): Promise<Property | null> {
  const { data, error } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as PropertyRow) : null;
}

export function formatPrecio(p: Property) {
  const monto = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(p.precio);
  return p.operacion === "renta" ? `${monto} / mes` : monto;
}

export function precioM2(p: Property) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Math.round(p.precio / p.superficie));
}

export function formatM2(p: Property) {
  return `${new Intl.NumberFormat("es-MX").format(p.superficie)} m²`;
}
export function formatAntiguedad(p: Property) {
  return p.antiguedad === 0 ? "A estrenar" : `${p.antiguedad} años`;
}

export function labelDisponibilidad(p: Property) {
  return DISPONIBILIDADES.find((d) => d.id === p.disponibilidad)?.label ?? "";
}
