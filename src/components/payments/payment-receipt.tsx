import type { ReceiptPayload } from "@/lib/payments/types";

export function PaymentReceipt({ payload }: { payload: ReceiptPayload }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
      <header className="mb-4 border-b border-slate-200 pb-3">
        <p className="text-lg font-bold text-slate-900">{payload.gymName}</p>
        <p>Reçu de paiement espèces</p>
        <p className="mt-1 text-xs text-slate-500">N° {payload.receiptNumber}</p>
      </header>

      <div className="grid gap-2">
        <p>
          <span className="font-semibold text-slate-900">Membre :</span> {payload.memberName}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Montant payé :</span> {payload.amountPaid.toFixed(2)} MAD
        </p>
        <p>
          <span className="font-semibold text-slate-900">Type d'abonnement :</span> {payload.subscriptionType}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Date de paiement :</span> {payload.paymentDate}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Validité :</span> du {payload.validityStartDate} au {payload.validityEndDate}
        </p>
        {payload.notes ? (
          <p>
            <span className="font-semibold text-slate-900">Notes :</span> {payload.notes}
          </p>
        ) : null}
      </div>

      <footer className="mt-6 border-t border-slate-200 pt-3 text-xs text-slate-500">
        Signature SuperAdmin : <span className="font-semibold text-slate-700">{payload.superAdminSignature}</span>
      </footer>
    </section>
  );
}
