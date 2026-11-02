import { createFileRoute, Link } from "@tanstack/react-router";
import { CabeceraPortal } from "@/components/CabeceraPortal";
import { SiteFooter } from "@/components/SiteFooter";
import { resumenAdmin } from "@/server/admin";
import { PESTANAS_ADMIN, soloAdmin } from "@/lib/admin-nav";

export const Route = createFileRoute("/admin/")({
  beforeLoad: ({ context }) => soloAdmin(context.sesion, "/admin"),
  loader: () => resumenAdmin(),
  head: () => ({ meta: [{ title: "Administración | Properties MarketPlace" }] }),
  component: Resumen,
});

function Resumen() {
  const resumen = Route.useLoaderData();
  const { sesion } = Route.useRouteContext();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <CabeceraPortal
        sesion={sesion}
        titulo="Administración"
        descripcion="Estado de la plataforma: inventario publicado, cuentas registradas y consultas en circulación."
        pestanas={PESTANAS_ADMIN}
        activa="/admin"
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <Bloque
          titulo="Anuncios"
          enlace={{ to: "/admin/anuncios", search: { estado: "todos" }, label: "Moderar anuncios" }}
          metricas={[
            { n: resumen.anuncios.total, l: "en total" },
            { n: resumen.anuncios.activos, l: "publicados" },
            { n: resumen.anuncios.borradores, l: "en borrador" },
            { n: resumen.anuncios.ocultos, l: "retirados", alerta: resumen.anuncios.ocultos > 0 },
          ]}
        />

        <Bloque
          titulo="Cuentas"
          enlace={{ to: "/admin/cuentas", search: { rol: "todos" }, label: "Gestionar cuentas" }}
          metricas={[
            { n: resumen.cuentas.total, l: "en total" },
            { n: resumen.cuentas.brokers, l: "brokers" },
            { n: resumen.cuentas.usuarios, l: "usuarios" },
            {
              n: resumen.cuentas.sinVerificar,
              l: "brokers sin verificar",
              alerta: resumen.cuentas.sinVerificar > 0,
            },
          ]}
        />

        <Bloque
          titulo="Consultas"
          metricas={[
            { n: resumen.consultas.total, l: "en total" },
            { n: resumen.consultas.nuevas, l: "sin leer por su broker" },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

function Bloque({
  titulo,
  metricas,
  enlace,
}: {
  titulo: string;
  metricas: { n: number; l: string; alerta?: boolean }[];
  enlace?: { to: string; search?: Record<string, unknown>; label: string };
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        {enlace && (
          <Link
            to={enlace.to}
            search={enlace.search}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {enlace.label} →
          </Link>
        )}
      </div>
      <div className="grid gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border sm:grid-cols-4">
        {metricas.map((m) => (
          <div key={m.l} className="bg-card px-5 py-4">
            <p
              className={`text-2xl font-semibold tabular-nums ${m.alerta ? "text-destructive" : ""}`}
            >
              {m.n}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
