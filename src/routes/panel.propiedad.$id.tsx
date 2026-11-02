import { createFileRoute, Link, notFound, redirect, useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CabeceraPortal } from "@/components/CabeceraPortal";
import { SiteFooter } from "@/components/SiteFooter";
import { MapaSelector } from "@/components/Mapa";
import { Aviso, AreaTexto, Campo, Selector, Texto, CLASE_CONTROL } from "@/components/Campo";
import { clienteNavegador } from "@/lib/supabase/browser";
import { esquemaPropiedad } from "@/lib/esquemas";
import {
  eliminarImagen,
  guardarPropiedad,
  obtenerMiPropiedad,
  registrarImagen,
} from "@/server/propiedades";
import {
  CATEGORIAS,
  DISPONIBILIDADES,
  ESTADOS_ANUNCIO,
  MONEDAS,
  type Imagen,
  type Property,
} from "@/lib/tipos";

const NUEVA = "nueva";

export const Route = createFileRoute("/panel/propiedad/$id")({
  beforeLoad: ({ context, params }) => {
    if (!context.sesion) {
      throw redirect({ to: "/entrar", search: { volver: `/panel/propiedad/${params.id}` } });
    }
    if (context.sesion.perfil.rol === "usuario") throw redirect({ to: "/guardadas" });
  },
  loader: async ({ params }) => {
    if (params.id === NUEVA) return { propiedad: null };
    const propiedad = await obtenerMiPropiedad({ data: { id: params.id } });
    if (!propiedad) throw notFound();
    return { propiedad };
  },
  head: ({ params }) => ({
    meta: [{ title: params.id === NUEVA ? "Publicar propiedad" : "Editar propiedad" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-6xl px-6 py-32 text-center">
      <p className="text-lg font-medium">No encontramos esa propiedad en su inventario.</p>
      <Link to="/panel" className="mt-4 inline-block text-sm text-primary underline">
        Volver a mi inventario
      </Link>
    </div>
  ),
  component: Formulario,
});

function Formulario() {
  const { propiedad } = Route.useLoaderData();
  const { sesion } = Route.useRouteContext();
  const router = useRouter();
  const esNueva = !propiedad;

  const [lat, setLat] = useState<number | null>(propiedad?.lat ?? null);
  const [lng, setLng] = useState<number | null>(propiedad?.lng ?? null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <CabeceraPortal
        sesion={sesion}
        titulo={esNueva ? "Publicar propiedad" : "Editar propiedad"}
        descripcion={
          esNueva
            ? "Complete la ficha del activo. Podrá añadir fotografías en cuanto lo guarde por primera vez."
            : propiedad.titulo
        }
        accion={
          <Link
            to="/panel"
            className="rounded-lg bg-card px-4 py-2.5 text-sm font-medium ring-1 ring-border transition-colors hover:bg-background"
          >
            Volver al inventario
          </Link>
        }
      />

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
        <form
          id="ficha"
          className="flex flex-col gap-6 rounded-2xl bg-card p-8 ring-1 ring-black/5"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const crudo = {
              id: propiedad?.id,
              titulo: String(fd.get("titulo") ?? ""),
              descripcion: String(fd.get("descripcion") ?? ""),
              ubicacion: String(fd.get("ubicacion") ?? ""),
              lat,
              lng,
              operacion: String(fd.get("operacion") ?? "venta"),
              categoria: String(fd.get("categoria") ?? "industrial"),
              disponibilidad: String(fd.get("disponibilidad") ?? "inmediata"),
              precio: Number(fd.get("precio")),
              moneda: String(fd.get("moneda") ?? "USD"),
              superficie: Number(fd.get("superficie")),
              usoSuelo: String(fd.get("usoSuelo") ?? ""),
              antiguedad: Number(fd.get("antiguedad") ?? 0),
              datoLabel: String(fd.get("datoLabel") ?? ""),
              datoValor: String(fd.get("datoValor") ?? ""),
              estado: String(fd.get("estado") ?? "borrador"),
            };

            const parsed = esquemaPropiedad.safeParse(crudo);
            if (!parsed.success) {
              const next: Record<string, string> = {};
              for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
              setErrores(next);
              setError("Revise los campos marcados.");
              return;
            }

            setErrores({});
            setError(null);
            setGuardando(true);
            const res = await guardarPropiedad({ data: parsed.data });
            setGuardando(false);

            if (!res.ok) {
              setError(res.error);
              return;
            }
            setGuardado(true);
            if (esNueva) {
              // La galería necesita el id de la propiedad para subir a Storage,
              // así que la primera vez se guarda y se vuelve ya en modo edición.
              router.navigate({ to: "/panel/propiedad/$id", params: { id: res.id } });
              return;
            }
            router.invalidate();
          }}
        >
          <Texto
            label="Título"
            name="titulo"
            defaultValue={propiedad?.titulo ?? ""}
            maxLength={140}
            error={errores.titulo}
            required
          />

          <AreaTexto
            label="Descripción"
            name="descripcion"
            rows={5}
            maxLength={4000}
            defaultValue={propiedad?.descripcion ?? ""}
            ayuda="Superficie útil, instalaciones, accesos, licencias. Lo que un inversor preguntaría primero."
            error={errores.descripcion}
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <Selector
              label="Operación"
              name="operacion"
              defaultValue={propiedad?.operacion ?? "venta"}
            >
              <option value="venta">Venta</option>
              <option value="renta">Renta</option>
            </Selector>
            <Selector
              label="Categoría"
              name="categoria"
              defaultValue={propiedad?.categoria ?? "industrial"}
            >
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Selector>
          </div>

          <div className="grid gap-6 sm:grid-cols-[1fr_120px]">
            <Texto
              label="Precio"
              name="precio"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              defaultValue={propiedad?.precio ?? ""}
              error={errores.precio}
              required
            />
            <Selector label="Moneda" name="moneda" defaultValue={propiedad?.moneda ?? "USD"}>
              {MONEDAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Selector>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Texto
              label="Superficie (m²)"
              name="superficie"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              defaultValue={propiedad?.superficie ?? ""}
              error={errores.superficie}
              required
            />
            <Texto
              label="Antigüedad (años)"
              name="antiguedad"
              type="number"
              min={0}
              max={200}
              defaultValue={propiedad?.antiguedad ?? 0}
              ayuda="0 = a estrenar o por desarrollar."
              error={errores.antiguedad}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Texto
              label="Uso de suelo"
              name="usoSuelo"
              defaultValue={propiedad?.usoSuelo ?? ""}
              maxLength={80}
              error={errores.usoSuelo}
            />
            <Selector
              label="Disponibilidad"
              name="disponibilidad"
              defaultValue={propiedad?.disponibilidad ?? "inmediata"}
            >
              {DISPONIBILIDADES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </Selector>
          </div>

          <fieldset className="grid gap-6 rounded-xl border border-border/70 p-5 sm:grid-cols-2">
            <legend className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Dato destacado (opcional)
            </legend>
            <Texto
              label="Etiqueta"
              name="datoLabel"
              placeholder="Andenes"
              maxLength={40}
              defaultValue={propiedad?.dato.label ?? ""}
            />
            <Texto
              label="Valor"
              name="datoValor"
              placeholder="12 posiciones"
              maxLength={60}
              defaultValue={propiedad?.dato.valor ?? ""}
            />
          </fieldset>

          <Texto
            label="Ubicación"
            name="ubicacion"
            defaultValue={propiedad?.ubicacion ?? ""}
            maxLength={160}
            ayuda="Ciudad, zona o corredor. Es lo que se muestra en el listado."
            error={errores.ubicacion}
            required
          />

          <Campo
            label="Punto en el mapa"
            ayuda="Haga clic en el mapa para colocar el marcador. Opcional, pero mejora mucho la ficha."
          >
            <div className="flex flex-col gap-3">
              <MapaSelector
                lat={lat}
                lng={lng}
                onCambio={(nuevaLat, nuevaLng) => {
                  setLat(nuevaLat);
                  setLng(nuevaLng);
                }}
              />
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {lat != null && lng != null ? (
                  <>
                    <span className="tabular-nums">
                      {lat.toFixed(5)}, {lng.toFixed(5)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLat(null);
                        setLng(null);
                      }}
                      className="font-medium text-primary underline"
                    >
                      Quitar marcador
                    </button>
                  </>
                ) : (
                  <span>Sin coordenadas.</span>
                )}
              </div>
            </div>
          </Campo>

          <Selector
            label="Estado de publicación"
            name="estado"
            defaultValue={
              propiedad?.estado === "oculto" ? "pausado" : (propiedad?.estado ?? "borrador")
            }
            ayuda={
              propiedad?.estado === "oculto"
                ? "Un administrador retiró este anuncio. Contacte al equipo de la plataforma."
                : "«Publicado» lo hace visible en el marketplace de inmediato."
            }
          >
            {ESTADOS_ANUNCIO.filter((e) => e.id !== "oculto").map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </Selector>

          {error && <Aviso>{error}</Aviso>}
          {guardado && !error && <Aviso tipo="ok">Cambios guardados.</Aviso>}

          <button
            type="submit"
            disabled={guardando}
            className="mt-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {guardando ? "Guardando…" : esNueva ? "Guardar y continuar" : "Guardar cambios"}
          </button>
        </form>

        <aside className="h-fit lg:sticky lg:top-24">
          <PanelGaleria propiedad={propiedad} />
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}

function PanelGaleria({ propiedad }: { propiedad: Property | null }) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!propiedad) {
    return (
      <div className="rounded-2xl bg-card p-8 ring-1 ring-black/5">
        <h2 className="text-base font-semibold">Fotografías</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Guarde la ficha una primera vez y aquí podrá subir la galería.
        </p>
      </div>
    );
  }

  async function subir(archivos: FileList) {
    setError(null);
    setSubiendo(true);
    const supabase = clienteNavegador();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubiendo(false);
      setError("Su sesión expiró. Vuelva a entrar.");
      return;
    }

    for (const archivo of Array.from(archivos)) {
      const ext = archivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
      // La primera carpeta tiene que ser el uid: es la condición que comprueba
      // la policy de Storage.
      const ruta = `${user.id}/${propiedad!.id}/${crypto.randomUUID()}.${ext}`;

      const { error: errorSubida } = await supabase.storage
        .from("propiedades")
        .upload(ruta, archivo, { cacheControl: "3600", upsert: false });

      if (errorSubida) {
        setError(`No pudimos subir ${archivo.name}: ${errorSubida.message}`);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("propiedades").getPublicUrl(ruta);

      await registrarImagen({
        data: { propertyId: propiedad!.id, url: publicUrl, path: ruta, alt: propiedad!.titulo },
      });
    }

    setSubiendo(false);
    if (entrada.current) entrada.current.value = "";
    router.invalidate();
  }

  async function quitar(imagen: Imagen) {
    await eliminarImagen({ data: { id: imagen.id } });
    router.invalidate();
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 ring-1 ring-black/5">
      <div>
        <h2 className="text-base font-semibold">Fotografías</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La primera imagen es la portada en el listado. JPG, PNG, WebP o AVIF, hasta 8 MB.
        </p>
      </div>

      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        disabled={subiendo}
        onChange={(e) => e.target.files?.length && subir(e.target.files)}
        className={`${CLASE_CONTROL} file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium`}
      />

      {subiendo && <p className="text-xs text-muted-foreground">Subiendo…</p>}
      {error && <Aviso>{error}</Aviso>}

      {propiedad.imagenes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay fotografías.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {propiedad.imagenes.map((img, i) => (
            <li key={img.id} className="flex items-center gap-3 rounded-lg bg-secondary p-2">
              <img src={img.url} alt="" className="size-14 shrink-0 rounded object-cover" />
              <span className="flex-1 text-xs text-muted-foreground">
                {i === 0 ? "Portada" : `Foto ${i + 1}`}
              </span>
              <button
                type="button"
                onClick={() => quitar(img)}
                className="rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
