import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PropertyCard } from "@/components/PropertyCard";
import { fetchPropertyById, fetchProperties, formatM2, formatPrecio, precioM2 } from "@/data/properties";

export const Route = createFileRoute("/propiedades/$id")({
  loader: async ({ params }) => {
    const [property, properties] = await Promise.all([
      fetchPropertyById(params.id),
      fetchProperties(),
    ]);
    if (!property) throw notFound();
    return { property, properties };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Propiedad no disponible" }, { name: "robots", content: "noindex" }],
      };
    }
    const { property } = loaderData;
    const title = `${property.titulo} — ${property.operacion === "venta" ? "En venta" : "En renta"}`;
    const description = `${property.titulo} en ${property.ubicacion}. ${formatM2(property)} · ${formatPrecio(property)}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  errorComponent: () => <Aviso texto="No pudimos cargar esta propiedad." />,
  notFoundComponent: () => <Aviso texto="Esta propiedad ya no está disponible." />,
  component: Detalle,
});

function Aviso({ texto }: { texto: string }) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-32 text-center">
        <p className="text-lg font-medium">{texto}</p>
        <Link to="/propiedades" className="mt-4 inline-block text-sm text-primary underline">
          Ver todo el inventario
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}

function Detalle() {
  const { property, properties } = Route.useLoaderData();
  const similares = properties
    .filter((p) => p.id !== property.id && p.categoria === property.categoria)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link to="/propiedades" className="text-sm text-muted-foreground hover:text-primary">
          ← Volver al inventario
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <img
              src={property.imagen}
              alt={`${property.titulo} en ${property.ubicacion}`}
              width={800}
              height={600}
              className="aspect-[4/3] w-full rounded-xl object-cover outline-1 -outline-offset-1 outline-black/5"
            />
            <h1 className="mt-8 text-3xl font-semibold">{property.titulo}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{property.ubicacion}</p>
            <p className="mt-6 max-w-[70ch] text-pretty text-base text-muted-foreground">
              {property.descripcion}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-border/70 pt-8 sm:grid-cols-4">
              <Dato label="Superficie" valor={formatM2(property)} />
              <Dato label="Precio / m²" valor={precioM2(property)} />
              <Dato label="Uso de Suelo" valor={property.usoSuelo} />
              <Dato label={property.dato.label} valor={property.dato.valor} />
            </div>
          </div>

          <aside className="h-fit rounded-2xl bg-card p-8 ring-1 ring-black/5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {property.operacion === "venta" ? "Precio de venta" : "Renta mensual"}
            </span>
            <p className="mt-2 text-2xl font-semibold">{formatPrecio(property)}</p>
            <a
              href={`mailto:contacto@activacomercial.mx?subject=${encodeURIComponent(`Interés en ${property.titulo}`)}`}
              className="mt-8 block rounded-lg bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground transition hover:brightness-110"
            >
              Solicitar información
            </a>
            <p className="mt-4 text-xs text-muted-foreground">
              Un asesor especializado le contactará con el expediente técnico del activo.
            </p>
          </aside>
        </div>

        {similares.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-8 text-2xl font-semibold">Activos similares</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {similares.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}
      </div>
      <SiteFooter />
    </div>
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