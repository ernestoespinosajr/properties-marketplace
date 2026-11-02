import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PropertyCard } from "@/components/PropertyCard";
import { listarPropiedades } from "@/server/propiedades";
import { idsFavoritos } from "@/server/favoritos";
import {
  ANTIGUEDADES,
  CATEGORIAS,
  DISPONIBILIDADES,
  type Categoria,
  type Disponibilidad,
  type Operacion,
} from "@/lib/tipos";

type Search = {
  pagina: number;
  categoria?: Categoria;
  operacion?: Operacion;
  q?: string;
  precioMin?: number;
  precioMax?: number;
  m2Min?: number;
  m2Max?: number;
  disponibilidad?: Disponibilidad;
  antiguedad?: string;
  orden?: string;
};

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const unaDe = <T extends string>(v: unknown, opciones: readonly T[]): T | undefined =>
  typeof v === "string" && (opciones as readonly string[]).includes(v) ? (v as T) : undefined;

const TITLE = "Propiedades comerciales en venta y renta | Properties MarketPlace";
const DESCRIPTION =
  "Explore el inventario completo de naves industriales, solares, locales y oficinas comerciales con filtros por precio, superficie, disponibilidad y antigüedad.";

export const Route = createFileRoute("/propiedades/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    pagina: Math.max(1, Math.trunc(Number(search.pagina)) || 1),
    categoria: unaDe(search.categoria, ["industrial", "solar", "local", "oficina"] as const),
    operacion: unaDe(search.operacion, ["venta", "renta"] as const),
    q: typeof search.q === "string" && search.q.trim() ? search.q.slice(0, 80) : undefined,
    precioMin: num(search.precioMin),
    precioMax: num(search.precioMax),
    m2Min: num(search.m2Min),
    m2Max: num(search.m2Max),
    disponibilidad: unaDe(search.disponibilidad, ["inmediata", "30-dias", "preventa"] as const),
    antiguedad: unaDe(
      search.antiguedad,
      ANTIGUEDADES.map((a) => a.id) as unknown as readonly string[],
    ),
    orden: typeof search.orden === "string" ? search.orden : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [pagina, favoritos] = await Promise.all([
      listarPropiedades({ data: deps }),
      idsFavoritos(),
    ]);
    return { pagina, favoritos };
  },
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
  const { pagina: resultado, favoritos } = Route.useLoaderData();
  const { sesion } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/propiedades/" });
  const guardadas = new Set(favoritos);

  // Cualquier cambio de filtro vuelve a la página 1: mantener la 4 al estrechar
  // la búsqueda dejaría al usuario mirando un listado vacío.
  const set = (patch: Partial<Search>) =>
    navigate({ search: (prev: Search) => ({ ...prev, ...patch, pagina: 1 }) });

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

  const filtrosActivos = Boolean(
    precioMin ||
    precioMax ||
    m2Min ||
    m2Max ||
    disponibilidad ||
    antiguedad ||
    q ||
    operacion ||
    categoria,
  );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader sesion={sesion} />
      <section className="bg-secondary px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold">Inventario de activos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {resultado.total}{" "}
            {resultado.total === 1 ? "propiedad disponible" : "propiedades disponibles"}
            {q ? ` para “${q}”` : ""}
          </p>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3">
          <Link
            to="/propiedades"
            search={{ ...search, categoria: undefined, pagina: 1 }}
            className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ring-black/5 transition-colors ${
              !categoria
                ? "bg-accent text-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            Todos los activos
          </Link>
          {CATEGORIAS.map((c) => (
            <Link
              key={c.id}
              to="/propiedades"
              search={{ ...search, categoria: c.id, pagina: 1 }}
              className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ring-black/5 transition-colors ${
                categoria === c.id
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
              search={{ ...search, operacion: operacion === op ? undefined : op, pagina: 1 }}
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
                  search={{ pagina: 1 }}
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

            <Grupo titulo="Precio">
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
                {resultado.total} resultado{resultado.total === 1 ? "" : "s"}
                {resultado.paginas > 1 && ` · página ${resultado.pagina} de ${resultado.paginas}`}
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

            {resultado.items.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No hay activos que coincidan con estos filtros.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {resultado.items.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      haySesion={Boolean(sesion)}
                      favorita={guardadas.has(p.id)}
                    />
                  ))}
                </div>
                <Paginacion actual={resultado.pagina} total={resultado.paginas} search={search} />
              </>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Paginacion({ actual, total, search }: { actual: number; total: number; search: Search }) {
  if (total <= 1) return null;

  // Ventana de 5 páginas alrededor de la actual: con inventario grande, pintar
  // un botón por página llenaría la pantalla de números.
  const desde = Math.max(1, Math.min(actual - 2, total - 4));
  const hasta = Math.min(total, desde + 4);
  const paginas = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);

  return (
    <nav aria-label="Paginación" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      <PasoPagina a={actual - 1} deshabilitado={actual === 1} search={search}>
        Anterior
      </PasoPagina>
      {desde > 1 && <span className="px-1 text-sm text-muted-foreground">…</span>}
      {paginas.map((p) => (
        <Link
          key={p}
          to="/propiedades"
          search={{ ...search, pagina: p }}
          aria-current={p === actual ? "page" : undefined}
          className={`min-w-10 rounded-lg px-3 py-2 text-center text-sm font-medium ring-1 transition-colors ${
            p === actual
              ? "bg-primary text-primary-foreground ring-primary"
              : "bg-card text-muted-foreground ring-border hover:bg-secondary"
          }`}
        >
          {p}
        </Link>
      ))}
      {hasta < total && <span className="px-1 text-sm text-muted-foreground">…</span>}
      <PasoPagina a={actual + 1} deshabilitado={actual === total} search={search}>
        Siguiente
      </PasoPagina>
    </nav>
  );
}

function PasoPagina({
  a,
  deshabilitado,
  search,
  children,
}: {
  a: number;
  deshabilitado: boolean;
  search: Search;
  children: React.ReactNode;
}) {
  if (deshabilitado) {
    return (
      <span className="rounded-lg px-4 py-2 text-sm text-muted-foreground/50" aria-disabled="true">
        {children}
      </span>
    );
  }
  return (
    <Link
      to="/propiedades"
      search={{ ...search, pagina: a }}
      className="rounded-lg bg-card px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-secondary"
    >
      {children}
    </Link>
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
        activo
          ? "bg-secondary font-medium text-foreground"
          : "text-muted-foreground hover:bg-secondary/60"
      }`}
    >
      <span
        className={`size-3.5 shrink-0 rounded-full ring-1 ring-border ${activo ? "bg-primary" : "bg-background"}`}
      />
      {label}
    </button>
  );
}
