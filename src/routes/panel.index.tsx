import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { CabeceraPortal, Vacio } from "@/components/CabeceraPortal";
import { SiteFooter } from "@/components/SiteFooter";
import { cambiarEstadoPropiedad, eliminarPropiedad, misPropiedades } from "@/server/propiedades";
import { consultasRecibidas } from "@/server/consultas";
import {
  ESTADOS_ANUNCIO,
  formatM2,
  formatPrecio,
  type EstadoAnuncio,
  type Property,
} from "@/lib/tipos";

const PESTANAS = [
  { to: "/panel", label: "Mi inventario" },
  { to: "/panel/consultas", label: "Consultas recibidas" },
];

export const Route = createFileRoute("/panel/")({
  beforeLoad: ({ context }) => {
    if (!context.sesion) throw redirect({ to: "/entrar", search: { volver: "/panel" } });
    if (context.sesion.perfil.rol === "usuario") throw redirect({ to: "/guardadas" });
  },
  loader: async () => {
    const [propiedades, consultas] = await Promise.all([misPropiedades(), consultasRecibidas()]);
    return { propiedades, nuevas: consultas.filter((c) => c.estado === "nueva").length };
  },
  head: () => ({ meta: [{ title: "Mi inventario | Properties MarketPlace" }] }),
  component: Panel,
});

function Panel() {
  const { propiedades, nuevas } = Route.useLoaderData();
  const { sesion } = Route.useRouteContext();

  const publicadas = propiedades.filter((p) => p.estado === "activo").length;
  const vistas = propiedades.reduce((n, p) => n + p.vistas, 0);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <CabeceraPortal
        sesion={sesion}
        titulo="Mi inventario"
        descripcion="Publique activos, controle su estado y siga las consultas que recibe."
        pestanas={PESTANAS}
        activa="/panel"
        accion={
          <Link
            to="/panel/propiedad/$id"
            params={{ id: "nueva" }}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110"
          >
            Publicar propiedad
          </Link>
        }
      />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 grid gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border sm:grid-cols-4">
          <Metrica n={propiedades.length} l="activos en total" />
          <Metrica n={publicadas} l="publicados" />
          <Metrica n={vistas} l="vistas acumuladas" />
          <Metrica n={nuevas} l="consultas sin leer" destacada={nuevas > 0} />
        </div>

        {propiedades.length === 0 ? (
          <Vacio
            titulo="Todavía no ha publicado ningún activo"
            texto="Publique su primera nave, solar, local u oficina y aparecerá en el marketplace en cuanto la marque como publicada."
            accion={
              <Link
                to="/panel/propiedad/$id"
                params={{ id: "nueva" }}
                className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
              >
                Publicar la primera
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {propiedades.map((p) => (
              <FilaPropiedad key={p.id} propiedad={p} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Metrica({ n, l, destacada = false }: { n: number; l: string; destacada?: boolean }) {
  return (
    <div className="bg-card px-5 py-4">
      <p className={`text-2xl font-semibold tabular-nums ${destacada ? "text-primary" : ""}`}>
        {n}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{l}</p>
    </div>
  );
}

const COLOR_ESTADO: Record<EstadoAnuncio, string> = {
  activo: "bg-primary/10 text-primary",
  borrador: "bg-secondary text-muted-foreground",
  pausado: "bg-secondary text-muted-foreground",
  vendido: "bg-foreground/10 text-foreground",
  oculto: "bg-destructive/10 text-destructive",
};

function FilaPropiedad({ propiedad }: { propiedad: Property }) {
  const router = useRouter();
  const portada = propiedad.imagenes[0];
  const bloqueada = propiedad.estado === "oculto";

  async function cambiar(estado: EstadoAnuncio) {
    if (estado === "oculto") return;
    await cambiarEstadoPropiedad({ data: { id: propiedad.id, estado } });
    router.invalidate();
  }

  async function borrar() {
    if (!confirm(`¿Eliminar “${propiedad.titulo}”? Esta acción no se puede deshacer.`)) return;
    await eliminarPropiedad({ data: { id: propiedad.id } });
    router.invalidate();
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-black/5 sm:flex-row sm:items-center">
      {portada ? (
        <img
          src={portada.url}
          alt=""
          className="h-28 w-full shrink-0 rounded-lg object-cover sm:h-20 sm:w-28"
        />
      ) : (
        <div className="grid h-28 w-full shrink-0 place-items-center rounded-lg bg-secondary text-[10px] text-muted-foreground sm:h-20 sm:w-28">
          Sin fotos
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-medium">{propiedad.titulo}</h2>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${COLOR_ESTADO[propiedad.estado]}`}
          >
            {ESTADOS_ANUNCIO.find((e) => e.id === propiedad.estado)?.label}
          </span>
          {propiedad.destacado && (
            <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              Destacada
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {propiedad.ubicacion} · {formatM2(propiedad)} · {formatPrecio(propiedad)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {propiedad.vistas} {propiedad.vistas === 1 ? "vista" : "vistas"} ·{" "}
          {propiedad.imagenes.length} {propiedad.imagenes.length === 1 ? "foto" : "fotos"}
        </p>
        {bloqueada && propiedad.motivoOcultado && (
          <p className="mt-2 rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {propiedad.motivoOcultado}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!bloqueada && (
          <select
            value={propiedad.estado}
            onChange={(e) => cambiar(e.target.value as EstadoAnuncio)}
            aria-label={`Estado de ${propiedad.titulo}`}
            className="rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ESTADOS_ANUNCIO.filter((e) => e.id !== "oculto").map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        )}
        <Link
          to="/panel/propiedad/$id"
          params={{ id: propiedad.id }}
          className="rounded-lg bg-secondary px-4 py-2 text-xs font-medium ring-1 ring-border transition-colors hover:bg-background"
        >
          Editar
        </Link>
        {propiedad.estado === "activo" && (
          <Link
            to="/propiedades/$slug"
            params={{ slug: propiedad.slug }}
            className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-primary"
          >
            Ver ficha
          </Link>
        )}
        <button
          type="button"
          onClick={borrar}
          className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
