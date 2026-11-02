import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Aviso, Texto } from "@/components/Campo";
import { iniciarSesion } from "@/server/auth";

export const Route = createFileRoute("/entrar")({
  validateSearch: (search: Record<string, unknown>) => ({
    volver: typeof search.volver === "string" ? search.volver : undefined,
  }),
  beforeLoad: ({ context, search }) => {
    if (context.sesion) throw redirect({ to: search.volver ?? "/" });
  },
  head: () => ({ meta: [{ title: "Entrar | Properties MarketPlace" }] }),
  component: Entrar,
});

function Entrar() {
  const { sesion } = Route.useRouteContext();
  const { volver } = Route.useSearch();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <SiteHeader sesion={sesion} />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 ring-1 ring-black/5">
          <h1 className="text-2xl font-semibold">Entrar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acceda a su inventario, sus propiedades guardadas y sus consultas.
          </p>

          <form
            className="mt-8 flex flex-col gap-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const datos = Object.fromEntries(new FormData(e.currentTarget)) as Record<
                string,
                string
              >;
              setError(null);
              setEnviando(true);
              const res = await iniciarSesion({
                data: { email: datos.email ?? "", password: datos.password ?? "" },
              });
              setEnviando(false);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              await router.invalidate();
              router.navigate({ to: volver ?? "/" });
            }}
          >
            <Texto
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            <Texto
              label="Contraseña"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            {error && <Aviso>{error}</Aviso>}
            <button
              type="submit"
              disabled={enviando}
              className="mt-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            ¿Todavía no tiene cuenta?{" "}
            <Link
              to="/registro"
              search={{ rol: "usuario" }}
              className="font-medium text-primary underline"
            >
              Crear una
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
