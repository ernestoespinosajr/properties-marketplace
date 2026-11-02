import { Link } from "@tanstack/react-router";
import { SiteHeader } from "./SiteHeader";
import type { Sesion } from "@/lib/tipos";

interface Pestana {
  to: string;
  search?: Record<string, unknown>;
  label: string;
}

/** Cabecera común a los tres portales: la del sitio más el título de la
 *  sección y sus pestañas, para que broker, usuario y admin se muevan igual. */
export function CabeceraPortal({
  sesion,
  titulo,
  descripcion,
  pestanas,
  activa,
  accion,
}: {
  sesion: Sesion | null;
  titulo: string;
  descripcion?: string;
  pestanas?: Pestana[];
  activa?: string;
  accion?: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader sesion={sesion} />
      <header className="border-b border-border/70 bg-secondary px-6 pt-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{titulo}</h1>
              {descripcion && (
                <p className="mt-2 max-w-[64ch] text-sm text-muted-foreground">{descripcion}</p>
              )}
            </div>
            {accion}
          </div>

          {pestanas && pestanas.length > 0 && (
            <nav className="mt-8 flex flex-wrap gap-1">
              {pestanas.map((p) => (
                <Link
                  key={p.to}
                  to={p.to}
                  search={p.search}
                  className={`rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activa === p.to
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
    </>
  );
}

export function Vacio({
  titulo,
  texto,
  accion,
}: {
  titulo: string;
  texto: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card p-12 text-center ring-1 ring-black/5">
      <p className="text-base font-medium">{titulo}</p>
      <p className="mx-auto mt-2 max-w-[52ch] text-sm text-muted-foreground">{texto}</p>
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  );
}
