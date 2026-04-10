import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DownloadReceiptButton } from "@/components/payments/download-receipt-button";
import type { ReceiptPayload } from "@/lib/payments/types";

type SearchParams = {
  dateFrom?: string;
  dateTo?: string;
  member?: string;
  amountMin?: string;
  amountMax?: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

export default async function PaymentsHistoryPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  let query = supabase
    .from("payment_transactions")
    .select(
      "id, amount, payment_date, receipt_number, notes, user_id, subscription_id, users!inner(name), subscriptions!inner(plan_type,start_date,end_date)",
      { count: "exact" }
    )
    .order("payment_date", { ascending: false });

  if (searchParams.dateFrom) query = query.gte("payment_date", `${searchParams.dateFrom}T00:00:00Z`);
  if (searchParams.dateTo) query = query.lte("payment_date", `${searchParams.dateTo}T23:59:59Z`);
  if (searchParams.amountMin) query = query.gte("amount", Number(searchParams.amountMin));
  if (searchParams.amountMax) query = query.lte("amount", Number(searchParams.amountMax));

  const { data, error, count } = await query;

  if (error) {
    return <main className="mx-auto max-w-6xl p-6">Erreur lors du chargement de l'historique: {error.message}</main>;
  }

  const normalizedRows = (data ?? [])
    .map((row: any) => {
      const user = Array.isArray(row.users) ? row.users[0] : row.users;
      const subscription = Array.isArray(row.subscriptions) ? row.subscriptions[0] : row.subscriptions;

      return {
        id: row.id,
        amount: Number(row.amount),
        payment_date: row.payment_date,
        receipt_number: row.receipt_number,
        notes: row.notes,
        member_name: user?.name ?? "Membre",
        plan_type: subscription?.plan_type ?? "-",
        start_date: subscription?.start_date ?? "",
        end_date: subscription?.end_date ?? ""
      };
    })
    .filter((row: any) => {
      if (!searchParams.member) return true;
      return row.member_name.toLowerCase().includes(searchParams.member.toLowerCase());
    });

  const csvHref = `/api/payments/export-csv?dateFrom=${searchParams.dateFrom ?? ""}&dateTo=${searchParams.dateTo ?? ""}&member=${encodeURIComponent(searchParams.member ?? "")}&amountMin=${searchParams.amountMin ?? ""}&amountMax=${searchParams.amountMax ?? ""}`;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Historique des transactions</h1>
      <p className="mt-1 text-slate-600">{count ?? 0} transaction(s) enregistrée(s).</p>

      <form className="mt-5 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-5" method="GET">
        <input className="rounded border px-3 py-2 text-sm" defaultValue={searchParams.dateFrom} name="dateFrom" type="date" />
        <input className="rounded border px-3 py-2 text-sm" defaultValue={searchParams.dateTo} name="dateTo" type="date" />
        <input className="rounded border px-3 py-2 text-sm" defaultValue={searchParams.member} name="member" placeholder="Membre" />
        <input className="rounded border px-3 py-2 text-sm" defaultValue={searchParams.amountMin} name="amountMin" placeholder="Montant min" type="number" />
        <input className="rounded border px-3 py-2 text-sm" defaultValue={searchParams.amountMax} name="amountMax" placeholder="Montant max" type="number" />

        <div className="md:col-span-5 flex gap-2">
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" type="submit">
            Filtrer
          </button>
          <Link className="rounded border px-3 py-2 text-sm" href={csvHref}>
            Export CSV
          </Link>
        </div>
      </form>

      <div className="mt-5 overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Membre</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Forfait</th>
              <th className="px-4 py-3">N° reçu</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {normalizedRows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={6}>
                  Aucune transaction trouvée.
                </td>
              </tr>
            ) : (
              normalizedRows.map((row) => {
                const payload: ReceiptPayload = {
                  gymName: "SPOT FITNESS",
                  receiptNumber: row.receipt_number,
                  memberName: row.member_name,
                  amountPaid: row.amount,
                  subscriptionType: row.plan_type,
                  validityStartDate: formatDate(row.start_date),
                  validityEndDate: formatDate(row.end_date),
                  paymentDate: formatDate(row.payment_date),
                  superAdminSignature: "SuperAdmin SPOT FITNESS",
                  notes: row.notes
                };

                return (
                  <tr className="border-t" key={row.id}>
                    <td className="px-4 py-3">{formatDate(row.payment_date)}</td>
                    <td className="px-4 py-3 font-medium">{row.member_name}</td>
                    <td className="px-4 py-3">{row.amount.toFixed(2)} MAD</td>
                    <td className="px-4 py-3">{row.plan_type}</td>
                    <td className="px-4 py-3">{row.receipt_number}</td>
                    <td className="px-4 py-3">
                      <DownloadReceiptButton payload={payload} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
