import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PropertyCard } from "@/components/PropertyCard";
import {
  ANTIGUEDADES,
  CATEGORIAS,
  DISPONIBILIDADES,
  fetchProperties,
  type Categoria,
  type Operacion,
} from "@/data/properties";

type Search = {
  categoria?: Categoria | "todos";
  operacion?: Operacion;
  q?: string;
  precioMin?: number;
  precioMax?: number;
  m2Min?: number;
  m2Max?: number;
  disponibilidad?: string;
  antiguedad?: string;
  orden?: string;
};

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const TITLE = "Propiedades comerciales en venta y renta | Activa Comercial";
const DESCRIPTION =
  "Explore el inventario completo de naves industriales, solares, locales y oficinas comerciales con filtros por precio, superficie, disponibilidad y antigüedad.";

export const Route = createFileRoute("/propiedades/")({
  loader: () => fetchProperties(),
  validateSearch: (search: Record<string, unknown>): Search => ({
    categoria: (search.categoria as Search["categoria"]) || undefined,
    operacion: (search.operacion as Operacion) || undefined,
    q: typeof search.q === "string" ? search.q.slice(0, 80) : undefined,
    precioMin: num(search.precioMin),
    precioMax: num(search.precioMax),
    m2Min: num(search.m2Min),
    m2Max: num(search.m2Max),
    disponibilidad: search.disponibilidad != null ? String(search.disponibilidad) : undefined,
    antiguedad: search.antiguedad != null ? String(search.antiguedad) : undefined,
    orden: search.orden != null ? String(search.orden) : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Listado,
});

const ORDENES = [
  { id: "relevancia", label: "Relevancia" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
  { id: "m2-desc", label: "Mayor superficie" },
  { id: "m2-precio", label: "Mejor precio por m²" },
  { id: "antiguedad-asc", label: "Más recientes" },
];

function Listado() {
  const properties = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/propiedades/" });
  const {
    categoria,
    operacion,
    q,
    precioMin,
    precioMax,
    m2Min,
    m2Max,
    disponibilidad,
    antiguedad,
    orden,
  } = search;

  const set = (patch: Partial<Search>) =>
    navigate({ search: (prev: Search) => ({ ...prev, ...patch }) });

  const maxAntiguedad = ANTIGUEDADES.find((a) => a.id === antiguedad)?.max;

  const resultados = properties
    .filter((p) => {
      if (categoria && categoria !== "todos" && p.categoria !== categoria) return false;
      if (operacion && p.operacion !== operacion) return false;
      if (q && !`${p.titulo} ${p.ubicacion}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (precioMin && p.precio < precioMin) return false;
      if (precioMax && p.precio > precioMax) return false;
      if (m2Min && p.superficie < m2Min) return false;
      if (m2Max && p.superficie > m2Max) return false;
      if (disponibilidad && p.disponibilidad !== disponibilidad) return false;
      if (maxAntiguedad !== undefined && p.antiguedad > maxAntiguedad) return false;
      return true;
    })
    .sort((a, b) => {
      switch (orden) {
        case "precio-asc":
          return a.precio - b.precio;
        case "precio-desc":
          return b.precio - a.precio;
        case "m2-desc":
          return b.superficie - a.superficie;
        case "m2-precio":
          return a.precio / a.superficie - b.precio / b.superficie;
        case "antiguedad-asc":
          return a.antiguedad - b.antiguedad;
        default:
          return 0;
      }
    });

  const filtrosActivos =
    Boolean(precioMin || precioMax || m2Min || m2Max || disponibilidad || antiguedad || q) ||
    Boolean(operacion) ||
    (categoria && categoria !== "todos");

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <section className="bg-secondary px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold">Inventario de activos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {resultados.length} propiedades disponibles
            {q ? ` para “${q}”` : ""}
          </p>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3">
          {CATEGORIAS.map((c) => (
            <Link
              key={c.id}
              to="/propiedades"
              search={(prev: Search) => ({
                ...prev,
                categoria: c.id === "todos" ? undefined : c.id,
              })}
              className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ring-black/5 transition-colors ${
                (categoria ?? "todos") === c.id
                  ? "bg-accent text-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {c.label}
            </Link>
          ))}
          {(["venta", "renta"] as Operacion[]).map((op) => (
            <Link
              key={op}
              to="/propiedades"
              search={(prev: Search) => ({ ...prev, operacion: operacion === op ? undefined : op })}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize ring-1 ring-black/5 transition-colors ${
                operacion === op
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {op}
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-2xl bg-card p-6 ring-1 ring-black/5 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Filtros avanzados
              </h2>
              {filtrosActivos && (
                <Link
                  to="/propiedades"
                  search={{}}
                  className="text-xs font-medium text-primary underline"
                >
                  Limpiar
                </Link>
              )}
            </div>

            <Grupo titulo="Palabra clave">
              <input
                type="search"
                defaultValue={q ?? ""}
                placeholder="Ubicación o nombre"
                maxLength={80}
                onChange={(e) => set({ q: e.target.value || undefined })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Grupo>

            <Grupo titulo="Precio (MXN)">
              <div className="flex gap-2">
                <NumInput
                  placeholder="Mínimo"
                  value={precioMin}
                  onChange={(v) => set({ precioMin: v })}
                />
                <NumInput
                  placeholder="Máximo"
                  value={precioMax}
                  onChange={(v) => set({ precioMax: v })}
                />
              </div>
            </Grupo>

            <Grupo titulo="Superficie (m²)">
              <div className="flex gap-2">
                <NumInput placeholder="Desde" value={m2Min} onChange={(v) => set({ m2Min: v })} />
                <NumInput placeholder="Hasta" value={m2Max} onChange={(v) => set({ m2Max: v })} />
              </div>
            </Grupo>

            <Grupo titulo="Disponibilidad">
              <div className="flex flex-col gap-2">
                {DISPONIBILIDADES.map((d) => (
                  <Opcion
                    key={d.id}
                    label={d.label}
                    activo={disponibilidad === d.id}
                    onClick={() =>
                      set({ disponibilidad: disponibilidad === d.id ? undefined : d.id })
                    }
                  />
                ))}
              </div>
            </Grupo>

            <Grupo titulo="Antigüedad">
              <div className="flex flex-wrap gap-2">
                {ANTIGUEDADES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => set({ antiguedad: antiguedad === a.id ? undefined : a.id })}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors ${
                      antiguedad === a.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </Grupo>
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {resultados.length} resultado{resultados.length === 1 ? "" : "s"}
              </p>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Ordenar por</span>
                <select
                  value={orden ?? "relevancia"}
                  onChange={(e) =>
                    set({ orden: e.target.value === "relevancia" ? undefined : e.target.value })
                  }
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ORDENES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {resultados.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No hay activos que coincidan con estos filtros.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {resultados.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 border-t border-border/70 pt-5 first-of-type:mt-5">
      <p className="mb-3 text-xs font-semibold text-foreground">{titulo}</p>
      {children}
    </div>
  );
}

function NumInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value?: number;
  onChange: (v?: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function Opcion({
  label,
  activo,
  onClick,
}: {
  label: string;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        activo ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/60"
      }`}
    >
      <span
        className={`size-3.5 shrink-0 rounded-full ring-1 ring-border ${activo ? "bg-primary" : "bg-background"}`}
      />
      {label}
    </button>
  );
}
