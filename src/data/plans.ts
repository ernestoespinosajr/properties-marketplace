import { supabase } from "@/lib/supabase";

export type PlanId = "inicial" | "profesional" | "corporativo";

export interface Plan {
  id: PlanId;
  nombre: string;
  rango: string;
  minProps: number;
  maxProps: number | null;
  precio: number;
  periodo: string;
  destacado?: boolean;
  beneficios: string[];
}

interface PlanRow {
  id: PlanId;
  nombre: string;
  rango: string;
  min_props: number;
  max_props: number | null;
  precio: number;
  periodo: string;
  destacado: boolean;
  beneficios: string[];
  orden: number;
}

function fromRow(row: PlanRow): Plan {
  return {
    id: row.id,
    nombre: row.nombre,
    rango: row.rango,
    minProps: row.min_props,
    maxProps: row.max_props,
    precio: row.precio,
    periodo: row.periodo,
    destacado: row.destacado,
    beneficios: row.beneficios,
  };
}

export async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await supabase.from("plans").select("*").order("orden");
  if (error) throw error;
  return (data as PlanRow[]).map(fromRow);
}

export async function fetchPlanById(id: string | undefined): Promise<Plan | undefined> {
  if (!id) return undefined;
  const { data, error } = await supabase.from("plans").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as PlanRow) : undefined;
}
