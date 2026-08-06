import { Link } from "@tanstack/react-router";
import {
  formatAntiguedad,
  formatM2,
  formatPrecio,
  labelDisponibilidad,
  precioM2,
  type Property,
} from "@/data/properties";

const BADGE: Record<string, string> = {
  venta: "bg-primary text-primary-foreground",
  renta: "bg-foreground text-background",
};

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      to="/propiedades/$id"
      params={{ id: property.id }}
      className="group flex flex-col"
    >
      <div className="relative mb-4">
        <img
          src={property.imagen}
          alt={`${property.titulo} en ${property.ubicacion}`}
          width={800}
          height={600}
          loading="lazy"
          className="aspect-[4/3] w-full rounded-xl object-cover outline-1 -outline-offset-1 outline-black/5"
        />
        <span
          className={`absolute left-3 top-3 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${BADGE[property.operacion]}`}
        >
          {property.operacion}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-medium leading-snug transition-colors group-hover:text-primary">
            {property.titulo}
          </h3>
          <span className="whitespace-nowrap text-sm font-semibold">{formatPrecio(property)}</span>
        </div>
        <p className="text-sm text-muted-foreground">{property.ubicacion}</p>
        <div className="mt-4 grid grid-cols-2 gap-y-2 border-t border-border/70 pt-4">
          <Dato label="Superficie" valor={formatM2(property)} />
          <Dato label="Precio / m²" valor={precioM2(property)} />
          <Dato label="Uso de Suelo" valor={property.usoSuelo} />
          <Dato label="Disponibilidad" valor={labelDisponibilidad(property)} />
          <Dato label="Antigüedad" valor={formatAntiguedad(property)} />
          <Dato label={property.dato.label} valor={property.dato.valor} />
        </div>
      </div>
    </Link>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-tighter text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">{valor}</span>
    </div>
  );
}