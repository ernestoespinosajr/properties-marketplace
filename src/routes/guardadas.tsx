import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { CabeceraPortal, Vacio } from "@/components/CabeceraPortal";
import { SiteFooter } from "@/components/SiteFooter";
import { anotarFavorito, alternarFavorito, misFavoritos } from "@/server/favoritos";
import { consultasEnviadas } from "@/server/consultas";
import {
  ESTADOS_ANUNCIO,
  formatM2,
  formatMonto,
  formatPrecio,
  type Consulta,
  type Favorito,
} from "@/lib/tipos";

export const Route = createFileRoute("/guardadas")({
  beforeLoad: ({ context }) => {
    if (!context.sesion) throw redirect({ to: "/entrar", search: { volver: "/guardadas" } });
  },
  loader: async () => {
    const [favoritos, consultas] = await Promise.all([misFavoritos(), consultasEnviadas()]);
    return { favoritos, consultas };
  },
  head: () => ({ meta: [{ title: "Guardadas y seguimiento | Properties MarketPlace" }] }),
  component: Guardadas,
});

function Guardadas() {
  const { favoritos, consultas } = Route.useLoaderData();
  const { sesion } = Route.useRouteContext();

  const conCambio = favoritos.filter(
    (f) => f.precioAlGuardar != null && f.precioAlGuardar !== f.propiedad.precio,
  );
  const bajaron = conCambio.filter((f) => f.propiedad.precio < (f.precioAlGuardar ?? 0));

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <CabeceraPortal
        sesion={sesion}
        titulo="Guardadas y seguimiento"
        descripcion="Las propiedades que guardó, con lo que ha cambiado su precio desde entonces."
      />

      <main className="mx-auto max-w-5xl px-6 py-10">
        {favoritos.length > 0 && (
          <div className="mb-10 grid gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border sm:grid-cols-3">
            <Metrica n={favoritos.length} l="propiedades guardadas" />
            <Metrica n={conCambio.length} l="con cambio de precio" />
            <Metrica n={bajaron.length} l="bajaron de precio" destacada={bajaron.length > 0} />
          </div>
        )}

        <section>
          <h2 className="mb-5 text-lg font-semibold">Propiedades guardadas</h2>
          {favoritos.length === 0 ? (
            <Vacio
              titulo="Todavía no ha guardado ninguna propiedad"
              texto="Pulse el corazón en cualquier activo del marketplace y aquí verá su evolución de precio y su disponibilidad."
              accion={
                <Link
                  to="/propiedades"
                  search={{ pagina: 1 }}
                  className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
                >
                  Explorar el inventario
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {favoritos.map((f) => (
                <FilaGuardada key={f.propiedad.id} favorito={f} />
              ))}
            </div>
          )}
        </section>

        {consultas.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-5 text-lg font-semibold">Consultas que envió</h2>
            <div className="flex flex-col gap-3">
              {consultas.map((c) => (
                <FilaConsulta key={c.id} consulta={c} />
              ))}
            </div>
          </section>
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

function FilaGuardada({ favorito }: { favorito: Favorito }) {
  const router = useRouter();
  const { propiedad: p } = favorito;
  const [editandoNota, setEditandoNota] = useState(false);
  const [nota, setNota] = useState(favorito.nota ?? "");
  const portada = p.imagenes[0];

  // El precio congelado al guardar se compara con el vigente. Si cambió la
  // moneda no se resta: serían cantidades de escalas distintas.
  const mismaMoneda = favorito.monedaAlGuardar === p.moneda;
  const delta =
    favorito.precioAlGuardar != null && mismaMoneda ? p.precio - favorito.precioAlGuardar : null;
  const pct =
    delta != null && favorito.precioAlGuardar
      ? Math.round((delta / favorito.precioAlGuardar) * 1000) / 10
      : null;

  const yaNoDisponible = p.estado !== "activo";

  async function quitar() {
    await alternarFavorito({ data: { propertyId: p.id } });
    router.invalidate();
  }

  async function guardarNota() {
    await anotarFavorito({ data: { propertyId: p.id, nota } });
    setEditandoNota(false);
    router.invalidate();
  }

  return (
    <article className="rounded-xl bg-card p-4 ring-1 ring-black/5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link to="/propiedades/$slug" params={{ slug: p.slug }} className="shrink-0">
          {portada ? (
            <img
              src={portada.url}
              alt=""
              className="h-28 w-full rounded-lg object-cover sm:h-24 sm:w-32"
            />
          ) : (
            <div className="grid h-28 w-full place-items-center rounded-lg bg-secondary text-[10px] text-muted-foreground sm:h-24 sm:w-32">
              Sin fotos
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to="/propiedades/$slug"
                params={{ slug: p.slug }}
                className="text-base font-medium hover:text-primary"
              >
                {p.titulo}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.ubicacion} · {formatM2(p)}
              </p>
            </div>
            <div className="text-right">
              <p className="whitespace-nowrap text-base font-semibold">{formatPrecio(p)}</p>
              {delta != null && delta !== 0 && (
                <p
                  className={`mt-0.5 whitespace-nowrap text-xs font-medium ${
                    delta < 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {delta < 0 ? "▼" : "▲"} {formatMonto(Math.abs(delta), p.moneda)}
                  {pct != null && ` (${Math.abs(pct)}%)`}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {yaNoDisponible && (
              <span className="rounded bg-destructive/10 px-2 py-1 font-medium text-destructive">
                {p.estado === "vendido"
                  ? "Ya se vendió"
                  : `Ya no está disponible · ${ESTADOS_ANUNCIO.find((e) => e.id === p.estado)?.label}`}
              </span>
            )}
            {delta === 0 && (
              <span className="text-muted-foreground">Mismo precio que cuando la guardó.</span>
            )}
            {delta == null && favorito.precioAlGuardar != null && !mismaMoneda && (
              <span className="text-muted-foreground">
                El broker cambió la moneda del anuncio, no se puede comparar.
              </span>
            )}
            <span className="text-muted-foreground">
              Guardada el{" "}
              {new Date(favorito.guardadoEn).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="mt-3 border-t border-border/70 pt-3">
            {editandoNota ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={2}
                  maxLength={400}
                  placeholder="Su nota privada sobre este activo"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={guardarNota}
                    className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    Guardar nota
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNota(favorito.nota ?? "");
                      setEditandoNota(false);
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {favorito.nota ? (
                  <p className="flex-1 text-sm text-muted-foreground">{favorito.nota}</p>
                ) : (
                  <p className="flex-1 text-sm text-muted-foreground/70">Sin notas.</p>
                )}
                <button
                  type="button"
                  onClick={() => setEditandoNota(true)}
                  className="text-xs font-medium text-primary underline"
                >
                  {favorito.nota ? "Editar nota" : "Añadir nota"}
                </button>
                <button
                  type="button"
                  onClick={quitar}
                  className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                >
                  Quitar de guardadas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function FilaConsulta({ consulta }: { consulta: Consulta }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card px-5 py-4 ring-1 ring-black/5">
      <div className="min-w-0">
        {consulta.propiedad ? (
          <Link
            to="/propiedades/$slug"
            params={{ slug: consulta.propiedad.slug }}
            className="text-sm font-medium hover:text-primary"
          >
            {consulta.propiedad.titulo}
          </Link>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">Propiedad retirada</span>
        )}
        {consulta.mensaje && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{consulta.mensaje}</p>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {consulta.estado === "respondida"
            ? "El broker respondió"
            : consulta.estado === "leida"
              ? "Leída por el broker"
              : "Enviada"}
        </span>
        <time>
          {new Date(consulta.creadaEn).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
          })}
        </time>
      </div>
    </div>
  );
}
