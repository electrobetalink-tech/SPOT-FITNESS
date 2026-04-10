export type PlanType = "monthly" | "semester" | "yearly";

export const PLAN_DEFINITIONS: Record<PlanType, { label: string; months: number; price: number }> = {
  monthly: { label: "Mensuel", months: 1, price: 300 },
  semester: { label: "Semestriel", months: 6, price: 1500 },
  yearly: { label: "Annuel", months: 12, price: 2800 }
};

export function addMonths(startDateISO: string, months: number) {
  const date = new Date(startDateISO);
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  utcDate.setUTCMonth(utcDate.getUTCMonth() + months);
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);
  return utcDate.toISOString().slice(0, 10);
}

export function computeSubscriptionPricing(planType: PlanType, discountPercent: number) {
  const basePrice = PLAN_DEFINITIONS[planType].price;
  const sanitizedDiscount = Math.max(0, Math.min(100, discountPercent));
  const discountAmount = Number(((basePrice * sanitizedDiscount) / 100).toFixed(2));
  const total = Number((basePrice - discountAmount).toFixed(2));

  return {
    basePrice,
    discountPercent: sanitizedDiscount,
    discountAmount,
    total
  };
}
