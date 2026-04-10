"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ReceiptPayload } from "@/lib/payments/types";
import { PaymentReceipt } from "./payment-receipt";

type PendingPaymentRow = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  plan_type: string;
  amount_paid: number;
  payment_request_date: string | null;
  user_name: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}

export function PaymentValidationModal({ subscription }: { subscription: PendingPaymentRow }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(subscription.amount_paid));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const payloadPreview: ReceiptPayload = useMemo(
    () => ({
      gymName: "SPOT FITNESS",
      receiptNumber: receiptNumber || "(auto)",
      memberName: subscription.user_name,
      amountPaid: Number(amount) || 0,
      subscriptionType: subscription.plan_type,
      validityStartDate: formatDate(subscription.start_date),
      validityEndDate: formatDate(subscription.end_date),
      paymentDate: formatDate(paymentDate),
      superAdminSignature: "SuperAdmin SPOT FITNESS",
      notes: notes || null
    }),
    [amount, notes, paymentDate, receiptNumber, subscription]
  );

  const ensureReceiptNumber = async () => {
    if (receiptNumber) return receiptNumber;

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("generate_receipt_number");
    if (rpcError || !data) {
      throw new Error("Impossible de générer un numéro de reçu.");
    }
    setReceiptNumber(data);
    return data;
  };

  const confirmPayment = async () => {
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const generatedReceiptNumber = await ensureReceiptNumber();
      const amountValue = Number(amount);

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          payment_date: new Date(paymentDate).toISOString(),
          amount_paid: amountValue,
          receipt_number: generatedReceiptNumber
        })
        .eq("id", subscription.id);

      if (updateError) {
        throw updateError;
      }

      const { error: insertError } = await supabase.from("payment_transactions").insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        amount: amountValue,
        payment_date: new Date(paymentDate).toISOString(),
        receipt_number: generatedReceiptNumber,
        notes: notes || null
      });

      if (insertError) {
        throw insertError;
      }

      const receiptPayload: ReceiptPayload = {
        ...payloadPreview,
        receiptNumber: generatedReceiptNumber
      };

      const response = await fetch("/api/generate-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptPayload)
      });

      if (!response.ok) {
        throw new Error("Impossible de générer le PDF du reçu.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${generatedReceiptNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        onClick={() => setOpen(true)}
        type="button"
      >
        Valider le paiement
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Validation paiement espèces</h3>
              <button className="text-slate-500" onClick={() => setOpen(false)} type="button">
                Fermer
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                Montant reçu
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  min="0"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setAmount(event.target.value)}
                  step="0.01"
                  type="number"
                  value={amount}
                />
              </label>

              <label className="text-sm">
                Date du paiement
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setPaymentDate(event.target.value)}
                  type="date"
                  value={paymentDate}
                />
              </label>
            </div>

            <label className="mt-3 block text-sm">
              Notes (optionnel)
              <textarea
                className="mt-1 w-full rounded-lg border px-3 py-2"
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value)}
                placeholder="Ex: paiement complet en espèces"
                rows={3}
                value={notes}
              />
            </label>

            <p className="mt-2 text-xs text-slate-500">Numéro de reçu généré automatiquement à la confirmation.</p>

            <div className="mt-4">
              <PaymentReceipt payload={payloadPreview} />
            </div>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setOpen(false)} type="button">
                Annuler
              </button>
              <button
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                disabled={busy}
                onClick={confirmPayment}
                type="button"
              >
                {busy ? "Traitement..." : "Confirmer le paiement"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
