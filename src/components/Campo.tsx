const ETIQUETA = "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground";
const CONTROL =
  "rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function Campo({
  label,
  error,
  ayuda,
  children,
}: {
  label: string;
  error?: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className={ETIQUETA}>{label}</span>
      {children}
      {ayuda && !error && <span className="text-xs text-muted-foreground">{ayuda}</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function Texto({
  label,
  name,
  error,
  ayuda,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  ayuda?: string;
}) {
  return (
    <Campo label={label} error={error} ayuda={ayuda}>
      <input name={name} className={CONTROL} {...props} />
    </Campo>
  );
}

export function AreaTexto({
  label,
  name,
  error,
  ayuda,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  error?: string;
  ayuda?: string;
}) {
  return (
    <Campo label={label} error={error} ayuda={ayuda}>
      <textarea name={name} className={CONTROL} {...props} />
    </Campo>
  );
}

export function Selector({
  label,
  name,
  error,
  ayuda,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  error?: string;
  ayuda?: string;
}) {
  return (
    <Campo label={label} error={error} ayuda={ayuda}>
      <select name={name} className={CONTROL} {...props}>
        {children}
      </select>
    </Campo>
  );
}

export function Aviso({
  tipo = "error",
  children,
}: {
  tipo?: "error" | "ok";
  children: React.ReactNode;
}) {
  return (
    <p
      role="alert"
      className={`rounded-lg px-4 py-3 text-sm ${
        tipo === "ok" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
      }`}
    >
      {children}
    </p>
  );
}

export const CLASE_CONTROL = CONTROL;
