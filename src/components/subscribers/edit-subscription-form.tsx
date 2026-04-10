"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PLAN_DEFINITIONS, addMonths, computeSubscriptionPricing, type PlanType } from "@/lib/subscriptions/plans";
import { PriceCalculator } from "@/components/subscribers/price-calculator";

type Status = "active" | "expired" | "blocked" | "pending_payment";

type Props = {
  subscription: {
    id: string;
    user_id: string;
    plan_type: PlanType;
    status: Status;
    start_date: string;
    end_date: string;
    remaining_balance: number;
    amount_paid: number;
  };
  memberName: string;
};

export function EditSubscriptionForm({ subscription, memberName }: Props) {
  const router = useRouter();
  const [planType, setPlanType] = useState<PlanType>(subscription.plan_type);
  const [status, setStatus] = useState<Status>(subscription.status);
  const [startDate, setStartDate] = useState(subscription.start_date);
  const [manualEndDate, setManualEndDate] = useState(subscription.end_date);
  const [remainingBalance, setRemainingBalance] = useState(subscription.remaining_balance);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoEndDate = useMemo(() => addMonths(startDate, PLAN_DEFINITIONS[planType].months), [startDate, planType]);
  const computedPricing = useMemo(() => computeSubscriptionPricing(planType, 0), [planType]);

  const save = async () => {
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient() as any;
      const previousStatus = subscription.status;
      const nextStatus = status;
      const willActivate = previousStatus === "pending_payment" && nextStatus === "active";

      const normalizedRemaining = Math.max(0, Number(remainingBalance) || 0);
      const paidAmount = Number((computedPricing.total - normalizedRemaining).toFixed(2));

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan_type: planType,
          status: nextStatus,
          start_date: startDate,
          end_date: manualEndDate || autoEndDate,
          payment_date: willActivate ? new Date().toISOString() : null,
          amount_paid: Math.max(0, paidAmount),
          remaining_balance: normalizedRemaining
        })
        .eq("id", subscription.id);

      if (updateError) throw updateError;

      await supabase.from("audit_log").insert({
        entity_type: "subscription",
        entity_id: subscription.id,
        action: "update",
        details: {
          previous_status: previousStatus,
          new_status: nextStatus,
          plan_type: planType,
          start_date: startDate,
          end_date: manualEndDate || autoEndDate,
          remaining_balance: normalizedRemaining
        }
      });

      if (willActivate) {
        await fetch("/api/generate-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gymName: "SPOT FITNESS",
            receiptNumber: `EDIT-${subscription.id.slice(0, 8)}`,
            memberName,
            amountPaid: paidAmount,
            subscriptionType: planType,
            validityStartDate: new Date(startDate).toLocaleDateString("fr-FR"),
            validityEndDate: new Date((manualEndDate || autoEndDate) + "T00:00:00").toLocaleDateString("fr-FR"),
            paymentDate: new Date().toLocaleDateString("fr-FR"),
            superAdminSignature: "SuperAdmin SPOT FITNESS",
            notes: "Activation depuis édition abonnement"
          })
        });
      }

      router.push("/admin/payments/history");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 rounded-xl border bg-white p-5">
      <p className="text-sm text-slate-600">Membre: {memberName}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Type
          <select className="mt-1 w-full rounded border px-3 py-2" onChange={(e) => setPlanType(e.target.value as PlanType)} value={planType}>
            {Object.entries(PLAN_DEFINITIONS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Statut
          <select className="mt-1 w-full rounded border px-3 py-2" onChange={(e) => setStatus(e.target.value as Status)} value={status}>
            <option value="pending_payment">pending_payment</option>
            <option value="active">active</option>
            <option value="expired">expired</option>
            <option value="blocked">blocked</option>
          </select>
        </label>

        <label className="text-sm">
          Date de début
          <input className="mt-1 w-full rounded border px-3 py-2" onChange={(e) => setStartDate(e.target.value)} type="date" value={startDate} />
        </label>

        <label className="text-sm">
          Date de fin
          <input className="mt-1 w-full rounded border px-3 py-2" onChange={(e) => setManualEndDate(e.target.value)} type="date" value={manualEndDate} />
          <span className="mt-1 block text-xs text-slate-500">Suggestion auto: {autoEndDate}</span>
        </label>

        <label className="text-sm md:col-span-2">
          Solde restant (paiement en plusieurs fois)
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            min="0"
            onChange={(e) => setRemainingBalance(Number(e.target.value))}
            step="0.01"
            type="number"
            value={remainingBalance}
          />
        </label>
      </div>

      <div className="mt-4">
        <PriceCalculator discountPercent={0} planType={planType} />
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 flex justify-end">
        <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white" disabled={saving} onClick={save} type="button">
          {saving ? "Enregistrement..." : "Mettre à jour"}
        </button>
      </div>
    </section>
  );
}
