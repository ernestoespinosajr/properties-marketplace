import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PropertyCard } from "@/components/PropertyCard";
import { Galeria } from "@/components/Galeria";
import { MapaVista } from "@/components/Mapa";
import { BotonFavorito } from "@/components/BotonFavorito";
import { Aviso, Texto, AreaTexto } from "@/components/Campo";
import { obtenerPropiedad } from "@/server/propiedades";
import { enviarConsulta } from "@/server/consultas";
import {
  formatM2,
  formatMonto,
  formatPrecio,
  labelDisponibilidad,
  precioM2,
  type Property,
  type PuntoPrecio,
} from "@/lib/tipos";

export const Route = createFileRoute("/propiedades/$slug")({
  loader: async ({ params }) => {
    const detalle = await obtenerPropiedad({ data: { slug: params.slug } });
    if (!detalle) throw notFound();
    return detalle;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Propiedad no disponible" }, { name: "robots", content: "noindex" }],
      };
    }
    const { propiedad } = loaderData;
    const title = `${propiedad.titulo} — ${propiedad.operacion === "venta" ? "En venta" : "En renta"}`;
    const description = `${propiedad.titulo} en ${propiedad.ubicacion}. ${formatM2(propiedad)} · ${formatPrecio(propiedad)}.`;
    const imagen = propiedad.imagenes[0]?.url;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        ...(imagen ? [{ property: "og:image", content: imagen }] : []),
      ],
    };
  },
  errorComponent: () => <AvisoPagina texto="No pudimos cargar esta propiedad." />,
  notFoundComponent: () => <AvisoPagina texto="Esta propiedad ya no está disponible." />,
  component: Detalle,
});

function AvisoPagina({ texto }: { texto: string }) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-32 text-center">
        <p className="text-lg font-medium">{texto}</p>
        <Link
          to="/propiedades"
          search={{ pagina: 1 }}
          className="mt-4 inline-block text-sm text-primary underline"
        >
          Ver todo el inventario
        </Link>
      </div>
    </div>
  );
}

function Detalle() {
  const { propiedad, historial, similares, favorita } = Route.useLoaderData();
  const { sesion } = Route.useRouteContext();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader sesion={sesion} />
      <script
        type="application/ld+json"
        // Datos estructurados: es lo que habilita los resultados enriquecidos de
        // Google, de donde llega la mayor parte del tráfico en inmobiliaria.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados(propiedad)) }}
      />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          to="/propiedades"
          search={{ pagina: 1 }}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Volver al inventario
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <Galeria imagenes={propiedad.imagenes} titulo={propiedad.titulo} />

            <h1 className="mt-8 text-3xl font-semibold">{propiedad.titulo}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{propiedad.ubicacion}</p>

            {propiedad.descripcion && (
              <p className="mt-6 max-w-[70ch] whitespace-pre-line text-pretty text-base text-muted-foreground">
                {propiedad.descripcion}
              </p>
            )}

            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-border/70 pt-8 sm:grid-cols-4">
              <Dato label="Superficie" valor={formatM2(propiedad)} />
              <Dato label="Precio / m²" valor={precioM2(propiedad)} />
              <Dato label="Uso de suelo" valor={propiedad.usoSuelo || "—"} />
              <Dato label="Disponibilidad" valor={labelDisponibilidad(propiedad)} />
              {propiedad.dato.label && (
                <Dato label={propiedad.dato.label} valor={propiedad.dato.valor} />
              )}
            </div>

            <HistorialPrecio historial={historial} />

            {(propiedad.lat != null || propiedad.lng != null) && (
              <section className="mt-12">
                <h2 className="mb-4 text-lg font-semibold">Ubicación</h2>
                <MapaVista lat={propiedad.lat} lng={propiedad.lng} etiqueta={propiedad.titulo} />
              </section>
            )}
          </div>

          <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-24">
            <div className="rounded-2xl bg-card p-8 ring-1 ring-black/5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {propiedad.operacion === "venta" ? "Precio de venta" : "Renta mensual"}
              </span>
              <p className="mt-2 text-2xl font-semibold">{formatPrecio(propiedad)}</p>

              {propiedad.broker && (
                <div className="mt-6 border-t border-border/70 pt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Publicado por
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium">
                    {propiedad.broker.agencia || propiedad.broker.nombre}
                    {propiedad.broker.verificado && (
                      <span
                        title="Agencia verificada por Properties MarketPlace"
                        className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                      >
                        Verificada
                      </span>
                    )}
                  </p>
                  {propiedad.broker.agencia && (
                    <p className="mt-1 text-sm text-muted-foreground">{propiedad.broker.nombre}</p>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                {propiedad.broker?.whatsapp && (
                  <a
                    href={enlaceWhatsapp(propiedad)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground transition hover:brightness-110"
                  >
                    Escribir por WhatsApp
                  </a>
                )}
                <BotonFavorito
                  propertyId={propiedad.id}
                  inicial={favorita}
                  haySesion={Boolean(sesion)}
                />
              </div>
            </div>

            <FormularioConsulta
              propiedad={propiedad}
              sesionEmail={sesion?.email}
              nombreSesion={sesion?.perfil.nombre}
            />
          </aside>
        </div>

        {similares.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-8 text-2xl font-semibold">Activos similares</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {similares.map((p) => (
                <PropertyCard key={p.id} property={p} haySesion={Boolean(sesion)} />
              ))}
            </div>
          </section>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function HistorialPrecio({ historial }: { historial: PuntoPrecio[] }) {
  if (historial.length < 2) return null;

  const primero = historial[0];
  const ultimo = historial[historial.length - 1];
  const cambio = ultimo.precio - primero.precio;
  const pct = Math.round((cambio / primero.precio) * 1000) / 10;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-semibold">Historial de precio</h2>
      <div className="rounded-2xl bg-card p-6 ring-1 ring-black/5">
        <p className="text-sm">
          {cambio === 0 ? (
            <span className="text-muted-foreground">
              El precio no ha cambiado desde su publicación.
            </span>
          ) : (
            <>
              <span
                className={cambio < 0 ? "font-medium text-primary" : "font-medium text-destructive"}
              >
                {cambio < 0 ? "Bajó" : "Subió"} {formatMonto(Math.abs(cambio), ultimo.moneda)} (
                {Math.abs(pct)}%)
              </span>{" "}
              <span className="text-muted-foreground">desde que se publicó.</span>
            </>
          )}
        </p>
        <ol className="mt-5 flex flex-col gap-3 border-t border-border/70 pt-5">
          {historial
            .slice()
            .reverse()
            .map((p, i) => (
              <li
                key={`${p.registradoEn}-${i}`}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="tabular-nums font-medium">{formatMonto(p.precio, p.moneda)}</span>
                <span className="text-xs text-muted-foreground">{fecha(p.registradoEn)}</span>
              </li>
            ))}
        </ol>
      </div>
    </section>
  );
}

function FormularioConsulta({
  propiedad,
  sesionEmail,
  nombreSesion,
}: {
  propiedad: Property;
  sesionEmail?: string;
  nombreSesion?: string;
}) {
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const esquema = z.object({
    nombre: z.string().trim().min(1, "Indique su nombre").max(100),
    email: z.string().trim().email("Correo inválido").max(255),
    telefono: z.string().trim().max(40).optional(),
    mensaje: z.string().trim().max(1200).optional(),
  });

  if (enviado) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-black/5">
        <p className="text-base font-medium">Consulta enviada</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {propiedad.broker?.nombre ?? "El broker"} recibió su mensaje y le contactará directamente.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-8 ring-1 ring-black/5">
      <h2 className="text-base font-semibold">Solicitar información</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Su consulta llega directamente al broker que publica este activo.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const datos = Object.fromEntries(new FormData(e.currentTarget));
          const parsed = esquema.safeParse(datos);
          if (!parsed.success) {
            const next: Record<string, string> = {};
            for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
            setErrores(next);
            return;
          }
          setErrores({});
          setError(null);
          setEnviando(true);
          const res = await enviarConsulta({
            data: {
              propertyId: propiedad.id,
              nombre: parsed.data.nombre,
              email: parsed.data.email,
              telefono: parsed.data.telefono,
              mensaje: parsed.data.mensaje ?? "",
            },
          });
          setEnviando(false);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setEnviado(true);
        }}
      >
        <Texto
          label="Nombre"
          name="nombre"
          defaultValue={nombreSesion ?? ""}
          error={errores.nombre}
        />
        <Texto
          label="Correo"
          name="email"
          type="email"
          defaultValue={sesionEmail ?? ""}
          error={errores.email}
        />
        <Texto label="Teléfono (opcional)" name="telefono" type="tel" error={errores.telefono} />
        <AreaTexto
          label="Mensaje"
          name="mensaje"
          rows={3}
          maxLength={1200}
          defaultValue={`Me interesa ${propiedad.titulo}. Quisiera recibir el expediente técnico.`}
          error={errores.mensaje}
        />
        {error && <Aviso>{error}</Aviso>}
        <button
          type="submit"
          disabled={enviando}
          className="mt-1 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviar consulta"}
        </button>
      </form>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-tighter text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">{valor}</span>
    </div>
  );
}

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function enlaceWhatsapp(p: Property) {
  const numero = (p.broker?.whatsapp ?? "").replace(/[^0-9]/g, "");
  const texto = `Hola, me interesa ${p.titulo} (${p.ubicacion}) publicada en Properties MarketPlace.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

function datosEstructurados(p: Property) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.titulo,
    description: p.descripcion,
    url: `/propiedades/${p.slug}`,
    datePosted: p.creadoEn,
    image: p.imagenes.map((i) => i.url),
    offers: {
      "@type": "Offer",
      price: p.precio,
      priceCurrency: p.moneda,
      availability: "https://schema.org/InStock",
      businessFunction:
        p.operacion === "venta" ? "https://schema.org/Sell" : "https://schema.org/LeaseOut",
    },
    ...(p.lat != null && p.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } }
      : {}),
    address: { "@type": "PostalAddress", addressLocality: p.ubicacion },
    floorSize: { "@type": "QuantitativeValue", value: p.superficie, unitCode: "MTK" },
  };
}
