import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-lg font-semibold tracking-tight text-primary">
            ACTIVA COMERCIAL
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              to="/propiedades"
              search={{ operacion: "venta" }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Venta
            </Link>
            <Link
              to="/propiedades"
              search={{ operacion: "renta" }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Renta
            </Link>
            <Link
              to="/propiedades"
              search={{ categoria: "solar" }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Solares
            </Link>
            <Link
              to="/planes"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Planes
            </Link>
          </div>
        </div>
        <Link
          to="/planes"
          className="flex items-center gap-1.5 rounded bg-primary py-2 pl-2 pr-3 text-sm font-medium text-primary-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="size-4 shrink-0 rounded-sm bg-primary-foreground/20" />
          <span>Publicar Propiedad</span>
        </Link>
      </div>
    </nav>
  );
}