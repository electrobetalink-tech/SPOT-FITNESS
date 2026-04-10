"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PLAN_DEFINITIONS, addMonths, computeSubscriptionPricing, type PlanType } from "@/lib/subscriptions/plans";
import { PriceCalculator } from "@/components/subscribers/price-calculator";

type ExistingMember = { id: string; name: string; email: string };

const todayISO = new Date().toISOString().slice(0, 10);

export function NewSubscriptionForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [existingMember, setExistingMember] = useState<ExistingMember | null>(null);
  const [emailCheckMessage, setEmailCheckMessage] = useState<string | null>(null);

  const [planType, setPlanType] = useState<PlanType>("monthly");
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [startDate, setStartDate] = useState(todayISO);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pricing = useMemo(() => computeSubscriptionPricing(planType, discountPercent), [planType, discountPercent]);
  const endDate = useMemo(() => addMonths(startDate, PLAN_DEFINITIONS[planType].months), [startDate, planType]);

  const checkEmail = async () => {
    if (!email) return;

    const supabase = createClient() as any;
    const { data, error: fetchError } = await supabase.from("users").select("id,name,email").eq("email", email).maybeSingle();

    if (fetchError) {
      setEmailCheckMessage("Erreur lors de la vérification email.");
      return;
    }

    if (data) {
      setExistingMember(data);
      setName(data.name);
      setEmailCheckMessage(`Compte existant trouvé: ${data.name}. Vous pouvez le lier.`);
      return;
    }

    setExistingMember(null);
    setEmailCheckMessage("Aucun compte existant pour cet email.");
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setDiscountPercent(0);
      return;
    }

    const supabase = createClient() as any;
    const { data, error: promoError } = await supabase
      .from("promotions")
      .select("discount_percent, valid_until, is_active")
      .ilike("code", promoCode.trim())
      .maybeSingle();

    if (promoError || !data || !data.is_active || new Date(data.valid_until) < new Date(todayISO)) {
      setDiscountPercent(0);
      setError("Code promo invalide ou expiré.");
      return;
    }

    setError(null);
    setDiscountPercent(data.discount_percent);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient() as any;

      let userId = existingMember?.id;
      if (!userId) {
        const qrCode = `SPOT-${crypto.randomUUID()}`;
        const { data: user, error: createUserError } = await supabase
          .from("users")
          .insert({ name, email, phone: phone || null, role: "member", qr_code: qrCode })
          .select("id")
          .single();

        if (createUserError || !user) throw createUserError ?? new Error("Impossible de créer le membre.");
        userId = user.id;
      }

      let promoCodeId: string | null = null;
      if (promoCode.trim()) {
        const { data: promo } = await supabase
          .from("promotions")
          .select("id")
          .ilike("code", promoCode.trim())
          .maybeSingle();
        promoCodeId = promo?.id ?? null;
      }

      const { error: subError } = await supabase.from("subscriptions").insert({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        plan_type: planType,
        status: "pending_payment",
        amount_paid: 0,
        remaining_balance: pricing.total,
        promo_code_id: promoCodeId,
        payment_request_date: new Date().toISOString()
      });

      if (subError) throw subError;

      router.push("/admin/payments");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création de l'abonnement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-6 rounded-xl border bg-white p-5">
      {step === 1 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Étape 1 · Informations du membre</h2>
          <input className="w-full rounded border px-3 py-2" onBlur={checkEmail} onChange={(e) => setEmail(e.target.value)} placeholder="Email" value={email} />
          <input className="w-full rounded border px-3 py-2" onChange={(e) => setName(e.target.value)} placeholder="Nom" value={name} />
          <input className="w-full rounded border px-3 py-2" onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" value={phone} />
          {emailCheckMessage ? <p className="text-sm text-slate-600">{emailCheckMessage}</p> : null}
          <div className="flex justify-end">
            <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" disabled={!email || !name} onClick={() => setStep(2)} type="button">
              Continuer
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Étape 2 · Choix de l'abonnement</h2>
          <select className="w-full rounded border px-3 py-2" onChange={(e) => setPlanType(e.target.value as PlanType)} value={planType}>
            {Object.entries(PLAN_DEFINITIONS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input className="w-full rounded border px-3 py-2" onChange={(e) => setPromoCode(e.target.value)} placeholder="Code promo (optionnel)" value={promoCode} />
            <button className="rounded border px-3 py-2 text-sm" onClick={applyPromoCode} type="button">
              Appliquer
            </button>
          </div>
          <input className="w-full rounded border px-3 py-2" onChange={(e) => setStartDate(e.target.value)} type="date" value={startDate} />
          <p className="text-sm text-slate-600">Date de fin (calculée): {endDate}</p>
          <PriceCalculator discountPercent={discountPercent} planType={planType} />
          <p className="font-semibold">Montant total à payer: {pricing.total.toFixed(2)} MAD</p>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-between">
            <button className="rounded border px-3 py-2 text-sm" onClick={() => setStep(1)} type="button">
              Retour
            </button>
            <button className="rounded bg-emerald-600 px-3 py-2 text-sm text-white" disabled={submitting} onClick={submit} type="button">
              {submitting ? "Création..." : "Créer l'abonnement"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
