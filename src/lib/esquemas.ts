import { z } from "zod";

/**
 * Esquemas compartidos entre el formulario del navegador y la server function
 * que guarda.
 *
 * Viven aquí y no en src/server/ a propósito: importar un valor desde un módulo
 * de servidor arrastra su árbol entero al bundle del cliente — incluido el
 * cliente de Supabase con las cookies de la petición — y TanStack Start lo
 * bloquea con su import-protection.
 */
export const esquemaPropiedad = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().trim().min(1, "Indique un título").max(140),
  descripcion: z.string().trim().max(4000).default(""),
  ubicacion: z.string().trim().min(1, "Indique la ubicación").max(160),
  lat: z.number().min(-90).max(90).nullable().default(null),
  lng: z.number().min(-180).max(180).nullable().default(null),
  operacion: z.enum(["venta", "renta"]),
  categoria: z.enum(["industrial", "solar", "local", "oficina"]),
  disponibilidad: z.enum(["inmediata", "30-dias", "preventa"]),
  precio: z.number().int().positive("El precio debe ser mayor que cero"),
  moneda: z.enum(["USD", "MXN", "DOP"]),
  superficie: z.number().int().positive("La superficie debe ser mayor que cero"),
  usoSuelo: z.string().trim().max(80).default(""),
  antiguedad: z.number().int().min(0).max(200).default(0),
  datoLabel: z.string().trim().max(40).default(""),
  datoValor: z.string().trim().max(60).default(""),
  estado: z.enum(["borrador", "activo", "pausado", "vendido"]),
});

export type DatosPropiedad = z.infer<typeof esquemaPropiedad>;
