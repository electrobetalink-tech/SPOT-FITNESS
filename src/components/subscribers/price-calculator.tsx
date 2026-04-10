"use client";

import { PLAN_DEFINITIONS, type PlanType, computeSubscriptionPricing } from "@/lib/subscriptions/plans";

type Props = {
  planType: PlanType;
  discountPercent: number;
};

export function PriceCalculator({ planType, discountPercent }: Props) {
  const pricing = computeSubscriptionPricing(planType, discountPercent);

  return (
    <div className="rounded-xl border bg-slate-50 p-4 text-sm">
      <h3 className="font-semibold">PriceCalculator</h3>
      <p className="mt-1 text-slate-600">Forfait: {PLAN_DEFINITIONS[planType].label}</p>
      <div className="mt-3 space-y-1">
        <p>Prix initial: {pricing.basePrice.toFixed(2)} MAD</p>
        <p>Réduction ({pricing.discountPercent}%): -{pricing.discountAmount.toFixed(2)} MAD</p>
        <p className="font-semibold">Total à payer en espèces: {pricing.total.toFixed(2)} MAD</p>
      </div>
    </div>
  );
}
