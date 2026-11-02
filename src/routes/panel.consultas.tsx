import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { CabeceraPortal, Vacio } from "@/components/CabeceraPortal";
import { SiteFooter } from "@/components/SiteFooter";
import { consultasRecibidas, marcarConsulta } from "@/server/consultas";
import type { Consulta, EstadoConsulta } from "@/lib/tipos";

const PESTANAS = [
  { to: "/panel", label: "Mi inventario" },
  { to: "/panel/consultas", label: "Consultas recibidas" },
];

export const Route = createFileRoute("/panel/consultas")({
  beforeLoad: ({ context }) => {
    if (!context.sesion) throw redirect({ to: "/entrar", search: { volver: "/panel/consultas" } });
    if (context.sesion.perfil.rol === "usuario") throw redirect({ to: "/guardadas" });
  },
  loader: () => consultasRecibidas(),
  head: () => ({ meta: [{ title: "Consultas recibidas | Properties MarketPlace" }] }),
  component: Consultas,
});

const COLOR: Record<EstadoConsulta, string> = {
  nueva: "bg-primary/10 text-primary",
  leida: "bg-secondary text-muted-foreground",
  respondida: "bg-accent text-foreground",
  archivada: "bg-secondary text-muted-foreground/70",
};

const ETIQUETA: Record<EstadoConsulta, string> = {
  nueva: "Nueva",
  leida: "Leída",
  respondida: "Respondida",
  archivada: "Archivada",
};

function Consultas() {
  const consultas = Route.useLoaderData();
  const { sesion } = Route.useRouteContext();
  const nuevas = consultas.filter((c) => c.estado === "nueva").length;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <CabeceraPortal
        sesion={sesion}
        titulo="Consultas recibidas"
        descripcion={
          nuevas > 0
            ? `Tiene ${nuevas} ${nuevas === 1 ? "consulta sin leer" : "consultas sin leer"}.`
            : "Aquí llegan los interesados en sus activos publicados."
        }
        pestanas={PESTANAS}
        activa="/panel/consultas"
      />

      <main className="mx-auto max-w-4xl px-6 py-10">
        {consultas.length === 0 ? (
          <Vacio
            titulo="Todavía no ha recibido consultas"
            texto="Cuando un interesado escriba desde la ficha de una de sus propiedades, la conversación aparecerá aquí con sus datos de contacto."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {consultas.map((c) => (
              <Tarjeta key={c.id} consulta={c} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Tarjeta({ consulta }: { consulta: Consulta }) {
  const router = useRouter();

  async function marcar(estado: EstadoConsulta) {
    await marcarConsulta({ data: { id: consulta.id, estado } });
    router.invalidate();
  }

  return (
    <article className="rounded-xl bg-card p-6 ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-medium">{consulta.nombre}</h2>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${COLOR[consulta.estado]}`}
            >
              {ETIQUETA[consulta.estado]}
            </span>
          </div>
          {consulta.propiedad && (
            <Link
              to="/propiedades/$slug"
              params={{ slug: consulta.propiedad.slug }}
              className="mt-1 block truncate text-sm text-muted-foreground hover:text-primary"
            >
              Sobre: {consulta.propiedad.titulo}
            </Link>
          )}
        </div>
        <time className="whitespace-nowrap text-xs text-muted-foreground">
          {new Date(consulta.creadaEn).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
      </div>

      {consulta.mensaje && (
        <p className="mt-4 whitespace-pre-line rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
          {consulta.mensaje}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-sm">
        <a href={`mailto:${consulta.email}`} className="font-medium text-primary hover:underline">
          {consulta.email}
        </a>
        {consulta.telefono && (
          <a href={`tel:${consulta.telefono}`} className="text-muted-foreground hover:text-primary">
            {consulta.telefono}
          </a>
        )}
        {consulta.telefono && (
          <a
            href={`https://wa.me/${consulta.telefono.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary"
          >
            WhatsApp
          </a>
        )}

        <div className="ml-auto flex flex-wrap gap-2">
          {consulta.estado === "nueva" && (
            <Accion onClick={() => marcar("leida")}>Marcar leída</Accion>
          )}
          {consulta.estado !== "respondida" && consulta.estado !== "archivada" && (
            <Accion onClick={() => marcar("respondida")}>Marcar respondida</Accion>
          )}
          {consulta.estado !== "archivada" && (
            <Accion onClick={() => marcar("archivada")}>Archivar</Accion>
          )}
          {consulta.estado === "archivada" && (
            <Accion onClick={() => marcar("leida")}>Restaurar</Accion>
          )}
        </div>
      </div>
    </article>
  );
}

function Accion({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors hover:bg-background"
    >
      {children}
    </button>
  );
}
