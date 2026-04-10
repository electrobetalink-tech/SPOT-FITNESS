import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditSubscriptionForm } from "@/components/subscribers/edit-subscription-form";

export default async function EditSubscriptionPage({ params }: { params: { id: string } }) {
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id,user_id,plan_type,status,start_date,end_date,remaining_balance,amount_paid,users!inner(name)")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) return notFound();

  const user = Array.isArray(data.users) ? data.users[0] : data.users;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Modifier l'abonnement</h1>
      <p className="mt-1 text-slate-600">Ajustez les dates, le type et le statut. Activation vers active: reçu généré.</p>
      <EditSubscriptionForm
        memberName={user?.name ?? "Membre"}
        subscription={{
          id: data.id,
          user_id: data.user_id,
          plan_type: data.plan_type,
          status: data.status,
          start_date: data.start_date,
          end_date: data.end_date,
          remaining_balance: Number(data.remaining_balance ?? 0),
          amount_paid: Number(data.amount_paid)
        }}
      />
    </main>
  );
}
