import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import type { Imagen } from "@/lib/tipos";

const MARCO =
  "aspect-[4/3] w-full rounded-xl object-cover outline-1 -outline-offset-1 outline-black/5";

export function Galeria({ imagenes, titulo }: { imagenes: Imagen[]; titulo: string }) {
  const [ref, embla] = useEmblaCarousel({ loop: imagenes.length > 1 });
  const [actual, setActual] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const alCambiar = () => setActual(embla.selectedScrollSnap());
    embla.on("select", alCambiar);
    alCambiar();
    return () => {
      embla.off("select", alCambiar);
    };
  }, [embla]);

  const ir = useCallback((i: number) => embla?.scrollTo(i), [embla]);

  if (imagenes.length === 0) {
    return (
      <div
        className={`${MARCO} grid place-items-center bg-secondary text-sm text-muted-foreground`}
      >
        Sin fotografías
      </div>
    );
  }

  if (imagenes.length === 1) {
    return (
      <img
        src={imagenes[0].url}
        alt={imagenes[0].alt || titulo}
        width={800}
        height={600}
        className={MARCO}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl" ref={ref}>
        <div className="flex">
          {imagenes.map((img) => (
            <div key={img.id} className="min-w-0 flex-[0_0_100%]">
              <img
                src={img.url}
                alt={img.alt || titulo}
                width={800}
                height={600}
                className={MARCO}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {imagenes.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => ir(i)}
            aria-label={`Ver fotografía ${i + 1} de ${imagenes.length}`}
            aria-current={i === actual}
            className={`size-16 overflow-hidden rounded-lg ring-2 transition ${
              i === actual ? "ring-primary" : "ring-transparent hover:ring-border"
            }`}
          >
            <img src={img.url} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
