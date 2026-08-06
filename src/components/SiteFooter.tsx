import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-12 md:flex-row">
        <div className="max-w-xs">
          <span className="text-lg font-semibold tracking-tight text-primary">ACTIVA COMERCIAL</span>
          <p className="mt-4 text-sm text-muted-foreground">
            Plataforma líder en inteligencia inmobiliaria comercial y transacciones de activos de
            inversión.
          </p>
        </div>
        <div className="flex flex-wrap gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground">
              Mercado
            </span>
            <Link
              to="/propiedades"
              search={{ categoria: "industrial" }}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Industrial
            </Link>
            <Link
              to="/propiedades"
              search={{ categoria: "local" }}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Retail
            </Link>
            <Link
              to="/propiedades"
              search={{ categoria: "oficina" }}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Oficinas
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground">
              Soporte
            </span>
            <Link to="/publicar" search={{ plan: undefined }} className="text-sm text-muted-foreground hover:text-primary">
              Publicar activo
            </Link>
            <a href="mailto:contacto@activacomercial.mx" className="text-sm text-muted-foreground hover:text-primary">
              Contacto
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-6xl border-t border-border/70 pt-8">
        <p className="text-xs text-muted-foreground">
          © 2026 Activa Comercial. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}