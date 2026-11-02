import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { CabeceraPortal, Vacio } from "@/components/CabeceraPortal";
import { SiteFooter } from "@/components/SiteFooter";
import { cambiarRol, listarCuentas, verificarBroker, type CuentaAdmin } from "@/server/admin";
import { PESTANAS_ADMIN, soloAdmin } from "@/lib/admin-nav";
import type { Rol } from "@/lib/tipos";

type FiltroRol = "todos" | Rol;
const FILTROS: FiltroRol[] = ["todos", "usuario", "broker", "admin"];

const ETIQUETA: Record<FiltroRol, string> = {
  todos: "Todas",
  usuario: "Usuarios",
  broker: "Brokers",
  admin: "Administradores",
};

export const Route = createFileRoute("/admin/cuentas")({
  beforeLoad: ({ context }) => soloAdmin(context.sesion, "/admin/cuentas"),
  validateSearch: (search: Record<string, unknown>) => ({
    rol: (FILTROS.includes(search.rol as FiltroRol) ? search.rol : "todos") as FiltroRol,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listarCuentas({ data: deps }),
  head: () => ({ meta: [{ title: "Cuentas | Properties MarketPlace" }] }),
  component: Cuentas,
});

function Cuentas() {
  const cuentas = Route.useLoaderData();
  const { sesion } = Route.useRouteContext();
  const { rol } = Route.useSearch();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <CabeceraPortal
        sesion={sesion}
        titulo="Cuentas"
        descripcion="Roles y verificación de agencias. El rol de administrador solo se concede desde aquí o directamente en la base de datos."
        pestanas={PESTANAS_ADMIN}
        activa="/admin/cuentas"
      />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex flex-wrap gap-3">
          {FILTROS.map((f) => (
            <Link
              key={f}
              to="/admin/cuentas"
              search={{ rol: f }}
              className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ring-black/5 transition-colors ${
                rol === f
                  ? "bg-accent text-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {ETIQUETA[f]}
            </Link>
          ))}
        </div>

        {cuentas.length === 0 ? (
          <Vacio titulo="Sin cuentas" texto="Ninguna cuenta coincide con este filtro." />
        ) : (
          <div className="flex flex-col gap-3">
            {cuentas.map((c) => (
              <FilaCuenta key={c.id} cuenta={c} soyYo={c.id === sesion?.perfil.id} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function FilaCuenta({ cuenta, soyYo }: { cuenta: CuentaAdmin; soyYo: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function cambiar(nuevo: Rol) {
    setError(null);
    setOcupado(true);
    const res = await cambiarRol({ data: { id: cuenta.id, rol: nuevo } });
    setOcupado(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.invalidate();
  }

  async function verificar() {
    setOcupado(true);
    await verificarBroker({ data: { id: cuenta.id, verificado: !cuenta.verificado } });
    setOcupado(false);
    router.invalidate();
  }

  return (
    <article className="rounded-xl bg-card p-5 ring-1 ring-black/5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {cuenta.nombre.slice(0, 1).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-medium">{cuenta.nombre}</h2>
            {soyYo && (
              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Usted
              </span>
            )}
            {cuenta.verificado && (
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                Verificada
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {cuenta.agencia || "Sin agencia"}
            {cuenta.rol !== "usuario" &&
              ` · ${cuenta.anuncios} ${cuenta.anuncios === 1 ? "anuncio" : "anuncios"}`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Registrada el{" "}
            {new Date(cuenta.creadaEn).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {cuenta.rol === "broker" && (
            <button
              type="button"
              onClick={verificar}
              disabled={ocupado}
              className="rounded-lg bg-secondary px-3 py-2 text-xs font-medium ring-1 ring-border transition-colors hover:bg-background disabled:opacity-60"
            >
              {cuenta.verificado ? "Quitar verificación" : "Verificar"}
            </button>
          )}
          <select
            value={cuenta.rol}
            onChange={(e) => cambiar(e.target.value as Rol)}
            disabled={ocupado || soyYo}
            title={soyYo ? "No puede cambiar su propio rol" : undefined}
            aria-label={`Rol de ${cuenta.nombre}`}
            className="rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-40"
          >
            <option value="usuario">Usuario</option>
            <option value="broker">Broker</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </article>
  );
}
