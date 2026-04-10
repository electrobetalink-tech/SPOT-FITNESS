import clsx from "clsx";

export type SubscriptionStatus = "actif" | "expire" | "bloque" | "en_attente";

const styles: Record<SubscriptionStatus, string> = {
  actif: "bg-emerald-100 text-emerald-700",
  expire: "bg-amber-100 text-amber-700",
  bloque: "bg-red-100 text-red-700",
  en_attente: "bg-slate-200 text-slate-700"
};

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span className={clsx("rounded-full px-2 py-1 text-xs font-semibold", styles[status])}>
      {status.replace("_", " ")}
    </span>
  );
}
