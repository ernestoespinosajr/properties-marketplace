import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { fetchPlans, fetchPlanById } from "@/data/plans";
import { supabase } from "@/lib/supabase";

const TITLE = "Publicar propiedad comercial | Activa Comercial";
const DESCRIPTION =
  "Liste su nave industrial, solar, local u oficina ante una red de inversores y empresas en expansión.";

export const Route = createFileRoute("/publicar")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: typeof search.plan === "string" ? search.plan : undefined,
  }),
  loaderDeps: ({ search }) => ({ plan: search.plan }),
  loader: async ({ deps }) => {
    const [plans, plan] = await Promise.all([fetchPlans(), fetchPlanById(deps.plan)]);
    return { plans, plan };
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Publicar,
});

const schema = z.object({
  nombre: z.string().trim().min(1, "Indique su nombre").max(100),
  email: z.string().trim().email("Correo inválido").max(255),
  tipo: z.string().min(1),
  ubicacion: z.string().trim().min(1, "Indique la ubicación").max(120),
  detalles: z.string().trim().max(1000).optional(),
});

function Publicar() {
  const { plans: PLANS, plan: planInicial } = Route.useLoaderData();
  const [planId, setPlanId] = useState<string>(planInicial?.id ?? PLANS[0]?.id ?? "");
  const plan = PLANS.find((p) => p.id === planId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <section className="bg-secondary px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-[24ch] text-balance text-3xl font-semibold leading-tight">
            Publique su activo comercial
          </h1>
          <p className="mt-4 max-w-[56ch] text-pretty text-base text-muted-foreground">
            Comparta los datos básicos del inmueble y nuestro equipo preparará la ficha técnica para
            publicarla ante inversores y desarrolladores.
          </p>
          {plan ? (
            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl bg-card p-5 ring-1 ring-black/5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                  Plan seleccionado
                </p>
                <p className="mt-1 text-base font-medium">
                  {plan.nombre} · {plan.rango}
                </p>
              </div>
              <p className="text-lg font-semibold">
                ${plan.precio}{" "}
                <span className="text-xs font-normal uppercase tracking-widest text-muted-foreground">
                  {plan.periodo}
                </span>
              </p>
              <Link to="/planes" className="text-sm font-medium text-primary underline">
                Cambiar plan
              </Link>
            </div>
          ) : (
            <Link
              to="/planes"
              className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
            >
              Ver paquetes de publicación
            </Link>
          )}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl bg-card p-8 ring-1 ring-black/5">
          {enviado ? (
            <div className="py-8 text-center">
              <p className="text-lg font-medium">Solicitud recibida</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Un asesor le contactará en menos de 24 horas hábiles.
              </p>
            </div>
          ) : (
            <form
              className="flex flex-col gap-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                const parsed = schema.safeParse(data);
                if (!parsed.success) {
                  const next: Record<string, string> = {};
                  for (const issue of parsed.error.issues) {
                    next[String(issue.path[0])] = issue.message;
                  }
                  setErrors(next);
                  return;
                }
                setErrors({});
                setErrorEnvio(null);
                setEnviando(true);
                const { error } = await supabase.from("leads").insert({
                  nombre: parsed.data.nombre,
                  email: parsed.data.email,
                  tipo: parsed.data.tipo,
                  ubicacion: parsed.data.ubicacion,
                  detalles: parsed.data.detalles || null,
                  plan_id: planId,
                });
                setEnviando(false);
                if (error) {
                  setErrorEnvio("No pudimos enviar su solicitud. Intente de nuevo.");
                  return;
                }
                setEnviado(true);
              }}
            >
              <Campo label="Nombre" name="nombre" error={errors.nombre} />
              <Campo label="Correo electrónico" name="email" type="email" error={errors.email} />
              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Tipo de activo
                </span>
                <select
                  name="tipo"
                  className="rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option>Nave Industrial</option>
                  <option>Solar / Terreno</option>
                  <option>Local Comercial</option>
                  <option>Oficina</option>
                </select>
              </label>
              <Campo label="Ubicación" name="ubicacion" error={errors.ubicacion} />
              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Paquete de publicación
                </span>
                <select
                  name="plan"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {PLANS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — {p.rango} (${p.precio} {p.periodo})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Detalles (opcional)
                </span>
                <textarea
                  name="detalles"
                  rows={4}
                  maxLength={1000}
                  className="rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              {errorEnvio && <p className="text-xs text-destructive">{errorEnvio}</p>}
              <button
                type="submit"
                disabled={enviando}
                className="mt-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
              >
                {enviando ? "Enviando…" : "Enviar solicitud"}
              </button>
            </form>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Campo({
  label,
  name,
  type = "text",
  error,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        name={name}
        type={type}
        maxLength={255}
        className="rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}