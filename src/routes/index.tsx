import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PropertyCard } from "@/components/PropertyCard";
import { CATEGORIAS, fetchProperties, type Categoria, type Operacion } from "@/data/properties";

const TITLE = "Activa Comercial — Naves, solares y locales en venta y renta";
const DESCRIPTION =
  "Marketplace inmobiliario comercial: encuentre naves industriales, solares urbanos, locales y oficinas en venta o renta con datos de superficie y precio por m².";

export const Route = createFileRoute("/")({
  loader: () => fetchProperties(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

function Index() {
  const properties = Route.useLoaderData();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState<Categoria | "todos">("todos");
  const [tipo, setTipo] = useState<Categoria>("industrial");
  const [ubicacion, setUbicacion] = useState("");
  const [operacion, setOperacion] = useState<Operacion | "todas">("todas");

  const destacadas = properties.filter(
    (p) => categoria === "todos" || p.categoria === categoria,
  );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />

      <section className="bg-secondary px-6 py-16 sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          <h1 className="mb-6 max-w-[20ch] text-balance text-3xl font-semibold leading-tight">
            Plataforma de activos comerciales y terrenos de inversión
          </h1>
          <p className="mb-12 max-w-[56ch] text-pretty text-base text-muted-foreground">
            Acceda a inventario exclusivo de naves industriales, locales en zonas de alto tráfico y
            solares con uso de suelo comercial para proyectos de gran escala.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({
                to: "/propiedades",
                search: {
                  categoria: tipo,
                  q: ubicacion.trim() || undefined,
                  operacion: operacion === "todas" ? undefined : operacion,
                },
              });
            }}
            className="flex w-full max-w-4xl flex-col gap-2 rounded-xl bg-card p-2 ring-1 ring-black/5 md:flex-row"
          >
            <label className="flex flex-1 flex-col items-start border-border/70 px-4 py-2 md:border-r">
              <span className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo
              </span>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as Categoria)}
                className="w-full bg-transparent text-sm font-medium focus:outline-none"
              >
                <option value="industrial">Nave Industrial</option>
                <option value="solar">Solar / Terreno</option>
                <option value="local">Local Comercial</option>
                <option value="oficina">Oficina</option>
              </select>
            </label>
            <label className="flex flex-1 flex-col items-start border-border/70 px-4 py-2 md:border-r">
              <span className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ubicación
              </span>
              <input
                type="text"
                value={ubicacion}
                maxLength={80}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ciudad o Zona"
                className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none"
              />
            </label>
            <label className="flex flex-1 flex-col items-start border-border/70 px-4 py-2 md:border-r">
              <span className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Operación
              </span>
              <select
                value={operacion}
                onChange={(e) => setOperacion(e.target.value as Operacion | "todas")}
                className="w-full bg-transparent text-sm font-medium focus:outline-none"
              >
                <option value="todas">Venta y renta</option>
                <option value="venta">Solo venta</option>
                <option value="renta">Solo renta</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      <section className="bg-background px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoria(c.id)}
                className={`flex-none rounded-full px-4 py-2 text-sm font-medium ring-1 ring-black/5 transition-colors ${
                  categoria === c.id
                    ? "bg-accent text-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl font-semibold">Propiedades Destacadas</h2>
            <Link to="/propiedades" className="text-sm text-muted-foreground hover:text-primary">
              {destacadas.length} resultados · ver todo
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {destacadas.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center rounded-2xl bg-primary p-12 text-center">
            <h2 className="mb-6 max-w-[25ch] text-balance text-3xl font-medium text-primary-foreground">
              ¿Tiene un activo comercial para listar?
            </h2>
            <p className="mb-10 max-w-[48ch] text-pretty text-base text-primary-foreground/80">
              Conectamos su propiedad con la red más amplia de inversores institucionales y
              desarrolladores en México y Latinoamérica.
            </p>
            <Link
              to="/publicar"
              search={{ plan: undefined }}
              className="rounded-lg bg-background px-10 py-4 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
            >
              Comenzar ahora
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
