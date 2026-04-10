import { StatusBadge, type SubscriptionStatus } from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";

function mapStatus(status: string): SubscriptionStatus {
  if (status === "active") return "actif";
  if (status === "blocked") return "bloque";
  if (status === "pending_payment") return "en_attente";
  return "expire";
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

function countDaysLeft(endDate: string | null) {
  if (!endDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const subscriptionEnd = new Date(endDate);
  subscriptionEnd.setHours(0, 0, 0, 0);

  const diff = subscriptionEnd.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

type MemberProfile = {
  id: string;
  name: string;
  email: string;
  qr_code: string;
};

type MemberSubscription = {
  status: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
  remaining_balance: number | null;
};

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold">Mon profil</h1>
        <p className="mt-2 text-slate-600">Vous devez être connecté pour consulter votre espace abonné.</p>
      </main>
    );
  }

  const [{ data: memberData }, { data: subscriptionData }] = await Promise.all([
    supabase.from("users").select("id, name, email, qr_code").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("status, plan_type, start_date, end_date, amount_paid, remaining_balance")
      .eq("user_id", user.id)
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const member = memberData as MemberProfile | null;
  const subscription = subscriptionData as MemberSubscription | null;

  const daysLeft = countDaysLeft(subscription?.end_date ?? null);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Mon profil</h1>
      <p className="mt-2 text-slate-600">Consultez votre statut d'abonnement et votre code membre.</p>

      <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Informations personnelles</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4 border-b pb-2">
            <dt className="text-slate-500">Nom</dt>
            <dd className="font-medium">{member?.name ?? "-"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b pb-2">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium">{member?.email ?? user.email ?? "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Abonnement actuel</h2>
        {subscription ? (
          <>
            <div className="mt-3">
              <StatusBadge status={mapStatus(subscription.status)} />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4 border-b pb-2">
                <dt className="text-slate-500">Forfait</dt>
                <dd className="font-medium">{subscription.plan_type}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b pb-2">
                <dt className="text-slate-500">Période</dt>
                <dd className="font-medium">
                  {formatDate(subscription.start_date)} → {formatDate(subscription.end_date)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b pb-2">
                <dt className="text-slate-500">Montant payé</dt>
                <dd className="font-medium">{Number(subscription.amount_paid).toFixed(2)} MAD</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b pb-2">
                <dt className="text-slate-500">Reste à payer</dt>
                <dd className="font-medium">{Number(subscription.remaining_balance ?? 0).toFixed(2)} MAD</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Jours restants</dt>
                <dd className="font-medium">{daysLeft === null ? "-" : daysLeft}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Aucun abonnement trouvé pour ce compte.</p>
        )}
      </section>

      <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Mon code membre</h2>
        <p className="mt-1 text-sm text-slate-500">Présentez ce code lors du scan à l'entrée.</p>
        <div className="mt-4 rounded-lg border bg-slate-50 p-4 font-mono text-sm">
          {member?.qr_code ?? "Code non disponible"}
        </div>
      </section>
    </main>
  );
}
