import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { cerrarSesion } from "@/server/auth";
import type { Sesion } from "@/lib/tipos";

const ENLACE = "text-sm font-medium text-muted-foreground transition-colors hover:text-primary";

export function SiteHeader({ sesion }: { sesion: Sesion | null }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const rol = sesion?.perfil.rol;

  async function salir() {
    await cerrarSesion();
    setAbierto(false);
    // invalidate() vuelve a correr el beforeLoad del root, que es donde se lee
    // la sesión: sin esto la cabecera seguiría mostrando al usuario conectado.
    await router.invalidate();
    router.navigate({ to: "/" });
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link
            to="/"
            className="whitespace-nowrap text-sm font-semibold tracking-tight text-primary sm:text-lg"
          >
            PROPERTIES MARKETPLACE
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link to="/propiedades" search={{ operacion: "venta", pagina: 1 }} className={ENLACE}>
              Venta
            </Link>
            <Link to="/propiedades" search={{ operacion: "renta", pagina: 1 }} className={ENLACE}>
              Renta
            </Link>
            <Link to="/propiedades" search={{ categoria: "solar", pagina: 1 }} className={ENLACE}>
              Solares
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!sesion && (
            <>
              <Link
                to="/entrar"
                search={{ volver: undefined }}
                className={`hidden sm:block ${ENLACE}`}
              >
                Entrar
              </Link>
              <Link
                to="/registro"
                search={{ rol: "broker" }}
                className="whitespace-nowrap rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110 sm:px-4"
              >
                Publicar<span className="hidden sm:inline"> propiedad</span>
              </Link>
            </>
          )}

          {sesion && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAbierto((v) => !v)}
                aria-expanded={abierto}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-border transition-colors hover:bg-secondary"
              >
                <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {sesion.perfil.nombre.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-[14ch] truncate sm:block">
                  {sesion.perfil.nombre}
                </span>
              </button>

              {abierto && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl bg-card py-2 shadow-lg ring-1 ring-black/10"
                >
                  <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {rol === "admin" ? "Administrador" : rol === "broker" ? "Broker" : "Cuenta"}
                  </p>

                  {rol === "broker" && (
                    <>
                      <Opcion to="/panel" onClick={() => setAbierto(false)}>
                        Mi inventario
                      </Opcion>
                      <Opcion to="/panel/consultas" onClick={() => setAbierto(false)}>
                        Consultas recibidas
                      </Opcion>
                    </>
                  )}

                  {rol === "admin" && (
                    <>
                      <Opcion to="/admin" onClick={() => setAbierto(false)}>
                        Panel de administración
                      </Opcion>
                      <Opcion
                        to="/admin/anuncios"
                        search={{ estado: "todos" }}
                        onClick={() => setAbierto(false)}
                      >
                        Moderar anuncios
                      </Opcion>
                      <Opcion
                        to="/admin/cuentas"
                        search={{ rol: "todos" }}
                        onClick={() => setAbierto(false)}
                      >
                        Cuentas
                      </Opcion>
                    </>
                  )}

                  <Opcion to="/guardadas" onClick={() => setAbierto(false)}>
                    Guardadas y seguimiento
                  </Opcion>
                  <Opcion to="/cuenta" onClick={() => setAbierto(false)}>
                    Mi perfil
                  </Opcion>

                  <button
                    type="button"
                    onClick={salir}
                    className="mt-1 w-full border-t border-border/70 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function Opcion({
  to,
  search,
  onClick,
  children,
}: {
  to: string;
  search?: Record<string, unknown>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      search={search}
      onClick={onClick}
      role="menuitem"
      className="block px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </Link>
  );
}
