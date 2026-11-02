import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { CabeceraPortal } from "@/components/CabeceraPortal";
import { SiteFooter } from "@/components/SiteFooter";
import { Aviso, AreaTexto, Texto } from "@/components/Campo";
import { actualizarPerfil } from "@/server/auth";

export const Route = createFileRoute("/cuenta")({
  beforeLoad: ({ context }) => {
    if (!context.sesion) throw redirect({ to: "/entrar", search: { volver: "/cuenta" } });
  },
  head: () => ({ meta: [{ title: "Mi perfil | Properties MarketPlace" }] }),
  component: Cuenta,
});

const ROL_LEGIBLE = {
  usuario: "Cuenta de usuario",
  broker: "Cuenta de broker",
  admin: "Administrador de la plataforma",
} as const;

function Cuenta() {
  const { sesion } = Route.useRouteContext();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  if (!sesion) return null;
  const { perfil } = sesion;
  const esBroker = perfil.rol !== "usuario";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <CabeceraPortal sesion={sesion} titulo="Mi perfil" descripcion={sesion.email} />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl bg-card px-5 py-4 ring-1 ring-black/5">
          <span className="text-sm font-medium">{ROL_LEGIBLE[perfil.rol]}</span>
          {perfil.verificado && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Verificada
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            El rol solo lo cambia un administrador.
          </span>
        </div>

        <form
          className="flex flex-col gap-6 rounded-2xl bg-card p-8 ring-1 ring-black/5"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError(null);
            setGuardando(true);
            const res = await actualizarPerfil({
              data: {
                nombre: String(fd.get("nombre") ?? ""),
                telefono: String(fd.get("telefono") ?? ""),
                whatsapp: String(fd.get("whatsapp") ?? ""),
                agencia: String(fd.get("agencia") ?? ""),
                bio: String(fd.get("bio") ?? ""),
              },
            });
            setGuardando(false);
            if (!res.ok) {
              setError(res.error);
              return;
            }
            setGuardado(true);
            router.invalidate();
          }}
        >
          <Texto
            label="Nombre"
            name="nombre"
            defaultValue={perfil.nombre}
            maxLength={100}
            required
          />

          {esBroker && (
            <>
              <Texto
                label="Agencia"
                name="agencia"
                defaultValue={perfil.agencia ?? ""}
                maxLength={120}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <Texto
                  label="Teléfono"
                  name="telefono"
                  type="tel"
                  defaultValue={perfil.telefono ?? ""}
                />
                <Texto
                  label="WhatsApp"
                  name="whatsapp"
                  type="tel"
                  defaultValue={perfil.whatsapp ?? ""}
                  ayuda="Con código de país. Aparece como botón en sus fichas."
                />
              </div>
              <AreaTexto
                label="Presentación"
                name="bio"
                rows={4}
                maxLength={600}
                defaultValue={perfil.bio ?? ""}
                ayuda="Se muestra junto a sus anuncios."
              />
            </>
          )}

          {!esBroker && (
            <Texto
              label="Teléfono"
              name="telefono"
              type="tel"
              defaultValue={perfil.telefono ?? ""}
            />
          )}

          {error && <Aviso>{error}</Aviso>}
          {guardado && !error && <Aviso tipo="ok">Perfil actualizado.</Aviso>}

          <button
            type="submit"
            disabled={guardando}
            className="mt-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
