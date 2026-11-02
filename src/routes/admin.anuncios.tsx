import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { CabeceraPortal, Vacio } from "@/components/CabeceraPortal";
import { SiteFooter } from "@/components/SiteFooter";
import { destacarAnuncio, listarTodoElInventario, moderarAnuncio } from "@/server/admin";
import { PESTANAS_ADMIN, soloAdmin } from "@/lib/admin-nav";
import {
  ESTADOS_ANUNCIO,
  formatM2,
  formatPrecio,
  type EstadoAnuncio,
  type Property,
} from "@/lib/tipos";

type Filtro = "todos" | EstadoAnuncio;
const FILTROS: Filtro[] = ["todos", "activo", "borrador", "pausado", "vendido", "oculto"];

export const Route = createFileRoute("/admin/anuncios")({
  beforeLoad: ({ context }) => soloAdmin(context.sesion, "/admin/anuncios"),
  validateSearch: (search: Record<string, unknown>) => ({
    estado: (FILTROS.includes(search.estado as Filtro) ? search.estado : "todos") as Filtro,
    q: typeof search.q === "string" && search.q.trim() ? search.q.slice(0, 80) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listarTodoElInventario({ data: deps }),
  head: () => ({ meta: [{ title: "Moderar anuncios | Properties MarketPlace" }] }),
  component: Anuncios,
});

const ETIQUETA_FILTRO: Record<Filtro, string> = {
  todos: "Todos",
  activo: "Publicados",
  borrador: "Borradores",
  pausado: "Pausados",
  vendido: "Vendidos",
  oculto: "Retirados",
};

function Anuncios() {
  const anuncios = Route.useLoaderData();
  const { sesion } = Route.useRouteContext();
  const { estado, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/anuncios" });

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <CabeceraPortal
        sesion={sesion}
        titulo="Anuncios"
        descripcion="Moderación posterior: los brokers publican directo y desde aquí se retira lo que no cumpla."
        pestanas={PESTANAS_ADMIN}
        activa="/admin/anuncios"
      />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {FILTROS.map((f) => (
            <Link
              key={f}
              to="/admin/anuncios"
              search={{ estado: f, q }}
              className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ring-black/5 transition-colors ${
                estado === f
                  ? "bg-accent text-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {ETIQUETA_FILTRO[f]}
            </Link>
          ))}
          <input
            type="search"
            defaultValue={q ?? ""}
            placeholder="Buscar por título"
            maxLength={80}
            onChange={(e) => navigate({ search: { estado, q: e.target.value || undefined } })}
            className="ml-auto w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {anuncios.length === 0 ? (
          <Vacio titulo="Sin resultados" texto="Ningún anuncio coincide con este filtro." />
        ) : (
          <div className="flex flex-col gap-3">
            {anuncios.map((a) => (
              <FilaAnuncio key={a.id} anuncio={a} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
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

function FilaAnuncio({ anuncio }: { anuncio: Property }) {
  const router = useRouter();
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const portada = anuncio.imagenes[0];

  async function ocultar() {
    setOcupado(true);
    await moderarAnuncio({ data: { id: anuncio.id, ocultar: true, motivo } });
    setOcupado(false);
    setPidiendoMotivo(false);
    setMotivo("");
    router.invalidate();
  }

  async function restaurar() {
    setOcupado(true);
    await moderarAnuncio({ data: { id: anuncio.id, ocultar: false } });
    setOcupado(false);
    router.invalidate();
  }

  async function destacar() {
    setOcupado(true);
    await destacarAnuncio({ data: { id: anuncio.id, destacado: !anuncio.destacado } });
    setOcupado(false);
    router.invalidate();
  }

  return (
    <article className="rounded-xl bg-card p-4 ring-1 ring-black/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {portada ? (
          <img
            src={portada.url}
            alt=""
            className="h-24 w-full shrink-0 rounded-lg object-cover sm:h-16 sm:w-24"
          />
        ) : (
          <div className="grid h-24 w-full shrink-0 place-items-center rounded-lg bg-secondary text-[10px] text-muted-foreground sm:h-16 sm:w-24">
            Sin fotos
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-medium">{anuncio.titulo}</h2>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${COLOR_ESTADO[anuncio.estado]}`}
            >
              {ESTADOS_ANUNCIO.find((e) => e.id === anuncio.estado)?.label}
            </span>
            {anuncio.destacado && (
              <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Destacada
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {anuncio.ubicacion} · {formatM2(anuncio)} · {formatPrecio(anuncio)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {anuncio.broker?.agencia || anuncio.broker?.nombre || "Sin broker"} · {anuncio.vistas}{" "}
            vistas
          </p>
          {anuncio.motivoOcultado && (
            <p className="mt-2 rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Retirado: {anuncio.motivoOcultado}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {anuncio.estado === "activo" && (
            <Link
              to="/propiedades/$slug"
              params={{ slug: anuncio.slug }}
              className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-primary"
            >
              Ver ficha
            </Link>
          )}
          <button
            type="button"
            onClick={destacar}
            disabled={ocupado || anuncio.estado !== "activo"}
            title={anuncio.estado !== "activo" ? "Solo se destacan anuncios publicados" : undefined}
            className="rounded-lg bg-secondary px-3 py-2 text-xs font-medium ring-1 ring-border transition-colors hover:bg-background disabled:opacity-40"
          >
            {anuncio.destacado ? "Quitar destaque" : "Destacar"}
          </button>
          {anuncio.estado === "oculto" ? (
            <button
              type="button"
              onClick={restaurar}
              disabled={ocupado}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
            >
              Restaurar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPidiendoMotivo((v) => !v)}
              disabled={ocupado}
              className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60"
            >
              Retirar
            </button>
          )}
        </div>
      </div>

      {pidiendoMotivo && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row">
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={300}
            placeholder="Motivo (lo verá el broker en su panel)"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={ocultar}
            disabled={ocupado}
            className="rounded-lg bg-destructive px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            Retirar anuncio
          </button>
          <button
            type="button"
            onClick={() => setPidiendoMotivo(false)}
            className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      )}
    </article>
  );
}
