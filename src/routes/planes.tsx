import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { fetchPlans } from "@/data/plans";

const TITLE = "Planes para publicar propiedades | Activa Comercial";
const DESCRIPTION =
  "Paquetes de publicación para agentes y desarrolladores: de 3 a 5, de 5 a 20 o más de 20 propiedades comerciales.";

export const Route = createFileRoute("/planes")({
  loader: () => fetchPlans(),
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
  component: Planes,
});

function Planes() {
  const PLANS = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />

      <section className="bg-secondary px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            Publicación directa
          </p>
          <h1 className="mt-3 max-w-[24ch] text-balance text-3xl font-semibold leading-tight">
            Elija su paquete y publique su inventario
          </h1>
          <p className="mt-4 max-w-[60ch] text-pretty text-base text-muted-foreground">
            Cargue usted mismo sus naves industriales, solares, locales y oficinas. El precio se
            ajusta al volumen de activos que administra.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl bg-card p-8 ring-1 ${
                plan.destacado ? "ring-2 ring-primary" : "ring-black/5"
              }`}
            >
              {plan.destacado && (
                <span className="mb-4 w-fit rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                  Más contratado
                </span>
              )}
              <h2 className="text-lg font-semibold">{plan.nombre}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.rango}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight">${plan.precio}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {plan.periodo}
                </span>
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-border/70 pt-6">
                {plan.beneficios.map((b) => (
                  <li key={b} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/publicar"
                search={{ plan: plan.id }}
                className={`mt-8 rounded-lg px-6 py-3 text-center text-sm font-medium transition hover:brightness-110 ${
                  plan.destacado
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground ring-1 ring-border"
                }`}
              >
                Contratar y publicar
              </Link>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-6xl text-sm text-muted-foreground">
          ¿Administra un portafolio mayor o necesita facturación anual? Escríbanos y armamos un
          paquete a medida.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
