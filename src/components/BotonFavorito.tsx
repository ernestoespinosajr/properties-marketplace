import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { alternarFavorito } from "@/server/favoritos";

export function BotonFavorito({
  propertyId,
  inicial,
  haySesion,
  compacto = false,
}: {
  propertyId: string;
  inicial: boolean;
  haySesion: boolean;
  compacto?: boolean;
}) {
  const router = useRouter();
  const [guardada, setGuardada] = useState(inicial);
  const [ocupado, setOcupado] = useState(false);

  async function alternar(e: React.MouseEvent) {
    // La tarjeta entera es un enlace: sin esto, guardar navegaría a la ficha.
    e.preventDefault();
    e.stopPropagation();

    if (!haySesion) {
      router.navigate({ to: "/entrar", search: { volver: window.location.pathname } });
      return;
    }

    const previo = guardada;
    setGuardada(!previo);
    setOcupado(true);
    const res = await alternarFavorito({ data: { propertyId } });
    setOcupado(false);
    if (!res.ok) {
      setGuardada(previo);
      return;
    }
    setGuardada(res.favorita);
    router.invalidate();
  }

  const etiqueta = guardada ? "Quitar de guardadas" : "Guardar propiedad";

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={ocupado}
      aria-pressed={guardada}
      aria-label={etiqueta}
      title={etiqueta}
      className={
        compacto
          ? `grid size-9 place-items-center rounded-full backdrop-blur-sm transition disabled:opacity-60 ${
              guardada
                ? "bg-primary text-primary-foreground"
                : "bg-background/85 text-foreground hover:bg-background"
            }`
          : `flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ring-1 transition disabled:opacity-60 ${
              guardada
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-background text-foreground ring-border hover:bg-secondary"
            }`
      }
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0">
        <path
          d="M12 20.5 4.6 13a4.6 4.6 0 1 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 1 1 19.4 13z"
          fill={guardada ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
      {!compacto && (guardada ? "Guardada" : "Guardar")}
    </button>
  );
}
