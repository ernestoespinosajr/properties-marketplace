import { Suspense, lazy, useEffect, useState } from "react";

// Leaflet toca `window` al importarse, así que el subárbol entero se carga
// perezosamente y solo después de montar en el navegador. Renderizarlo durante
// el SSR reventaría el servidor.
const VistaInterna = lazy(() => import("./MapaInterno").then((m) => ({ default: m.VistaInterna })));
const SelectorInterno = lazy(() =>
  import("./MapaInterno").then((m) => ({ default: m.SelectorInterno })),
);

function useMontado() {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado;
}

function Marco({ children }: { children?: React.ReactNode }) {
  return (
    <div className="grid h-full w-full place-items-center bg-secondary text-xs text-muted-foreground">
      {children}
    </div>
  );
}

const CARGANDO = <Marco>Cargando mapa…</Marco>;

export function MapaVista({
  lat,
  lng,
  etiqueta,
  className = "h-72 w-full overflow-hidden rounded-xl ring-1 ring-black/5",
}: {
  lat: number | null;
  lng: number | null;
  etiqueta?: string;
  className?: string;
}) {
  const montado = useMontado();

  if (lat == null || lng == null) {
    return (
      <div className={className}>
        <Marco>Este anuncio no tiene ubicación en el mapa.</Marco>
      </div>
    );
  }

  return (
    <div className={className}>
      {montado ? (
        <Suspense fallback={CARGANDO}>
          <VistaInterna lat={lat} lng={lng} etiqueta={etiqueta} />
        </Suspense>
      ) : (
        CARGANDO
      )}
    </div>
  );
}

export function MapaSelector({
  lat,
  lng,
  onCambio,
}: {
  lat: number | null;
  lng: number | null;
  onCambio: (lat: number, lng: number) => void;
}) {
  const montado = useMontado();

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl ring-1 ring-black/5">
      {montado ? (
        <Suspense fallback={CARGANDO}>
          <SelectorInterno lat={lat} lng={lng} onCambio={onCambio} />
        </Suspense>
      ) : (
        CARGANDO
      )}
    </div>
  );
}
