import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Aviso, Texto } from "@/components/Campo";
import { iniciarSesion, registrarse } from "@/server/auth";

export const Route = createFileRoute("/registro")({
  validateSearch: (search: Record<string, unknown>) => ({
    rol: search.rol === "broker" ? ("broker" as const) : ("usuario" as const),
  }),
  beforeLoad: ({ context }) => {
    if (context.sesion) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "Crear cuenta | Properties MarketPlace" }] }),
  component: Registro,
});

const esquema = z.object({
  nombre: z.string().trim().min(1, "Indique su nombre").max(100),
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres").max(72),
  telefono: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  agencia: z.string().trim().max(120).optional(),
});

function Registro() {
  const { sesion } = Route.useRouteContext();
  const { rol } = Route.useSearch();
  const router = useRouter();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const esBroker = rol === "broker";

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <SiteHeader sesion={sesion} />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg rounded-2xl bg-card p-8 ring-1 ring-black/5">
          <div className="flex gap-2 rounded-lg bg-secondary p-1">
            <Pestana activa={!esBroker} to="usuario">
              Busco propiedades
            </Pestana>
            <Pestana activa={esBroker} to="broker">
              Publico propiedades
            </Pestana>
          </div>

          <h1 className="mt-8 text-2xl font-semibold">
            {esBroker ? "Cuenta de broker" : "Crear cuenta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {esBroker
              ? "Publique su inventario, reciba consultas de interesados y administre sus anuncios."
              : "Guarde propiedades, siga sus cambios de precio y contacte a los brokers."}
          </p>

          <form
            className="mt-8 flex flex-col gap-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const datos = Object.fromEntries(new FormData(e.currentTarget));
              const parsed = esquema.safeParse(datos);
              if (!parsed.success) {
                const next: Record<string, string> = {};
                for (const issue of parsed.error.issues)
                  next[String(issue.path[0])] = issue.message;
                setErrores(next);
                return;
              }
              setErrores({});
              setError(null);
              setEnviando(true);

              const res = await registrarse({ data: { ...parsed.data, rol } });
              if (!res.ok) {
                setEnviando(false);
                setError(res.error);
                return;
              }

              // Si el proyecto de Supabase exige confirmar el correo, este login
              // falla y el usuario tiene que revisar su bandeja antes de entrar.
              const acceso = await iniciarSesion({
                data: { email: parsed.data.email, password: parsed.data.password },
              });
              setEnviando(false);

              if (!acceso.ok) {
                setError(
                  "Cuenta creada. Confirme su correo desde el enlace que le enviamos y luego inicie sesión.",
                );
                return;
              }
              await router.invalidate();
              router.navigate({
                to: esBroker ? "/panel" : "/propiedades",
                search: esBroker ? undefined : { pagina: 1 },
              });
            }}
          >
            <Texto label="Nombre completo" name="nombre" error={errores.nombre} required />
            <Texto
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              error={errores.email}
              required
            />
            <Texto
              label="Contraseña"
              name="password"
              type="password"
              autoComplete="new-password"
              ayuda="Mínimo 8 caracteres."
              error={errores.password}
              required
            />

            {esBroker && (
              <>
                <Texto label="Agencia (opcional)" name="agencia" error={errores.agencia} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Texto label="Teléfono" name="telefono" type="tel" error={errores.telefono} />
                  <Texto
                    label="WhatsApp"
                    name="whatsapp"
                    type="tel"
                    ayuda="Con código de país."
                    error={errores.whatsapp}
                  />
                </div>
              </>
            )}

            {error && <Aviso>{error}</Aviso>}

            <button
              type="submit"
              disabled={enviando}
              className="mt-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              {enviando ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            ¿Ya tiene cuenta?{" "}
            <Link
              to="/entrar"
              search={{ volver: undefined }}
              className="font-medium text-primary underline"
            >
              Entrar
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Pestana({
  activa,
  to,
  children,
}: {
  activa: boolean;
  to: "usuario" | "broker";
  children: React.ReactNode;
}) {
  return (
    <Link
      to="/registro"
      search={{ rol: to }}
      className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
        activa ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
