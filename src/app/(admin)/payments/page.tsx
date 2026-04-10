import { createClient } from "@/lib/supabase/server";
import { PaymentValidationModal } from "@/components/payments/payment-validation-modal";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

export default async function AdminPaymentsPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, plan_type, amount_paid, remaining_balance, payment_request_date, created_at, start_date, end_date, users!inner(name)")
    .eq("status", "pending_payment")
    .order("payment_request_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    return <main className="mx-auto max-w-6xl p-6">Erreur lors du chargement des paiements: {error.message}</main>;
  }

  const rows = (data ?? []).map((row: any) => {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;

    return {
      id: row.id,
      user_id: row.user_id,
      plan_type: row.plan_type,
      amount_paid: Number(row.amount_paid),
      remaining_balance: Number(row.remaining_balance ?? 0),
      payment_request_date: row.payment_request_date,
      created_at: row.created_at,
      start_date: row.start_date,
      end_date: row.end_date,
      user_name: user?.name ?? "Membre"
    };
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Paiements espèces en attente</h1>
      <p className="mt-1 text-slate-600">Validez les abonnements ayant le statut pending_payment.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Membre</th>
              <th className="px-4 py-3">Montant dû</th>
              <th className="px-4 py-3">Forfait</th>
              <th className="px-4 py-3">Date de demande</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  Aucun abonnement en attente de paiement.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="border-t" key={row.id}>
                  <td className="px-4 py-3 font-medium">{row.user_name}</td>
                  <td className="px-4 py-3">{row.remaining_balance.toFixed(2)} MAD</td>
                  <td className="px-4 py-3">{row.plan_type}</td>
                  <td className="px-4 py-3">{formatDate(row.payment_request_date ?? row.created_at)}</td>
                  <td className="px-4 py-3">
                    <PaymentValidationModal subscription={row} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
