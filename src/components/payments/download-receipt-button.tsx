"use client";

import { useState } from "react";
import type { ReceiptPayload } from "@/lib/payments/types";

export function DownloadReceiptButton({ payload }: { payload: ReceiptPayload }) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/generate-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Erreur génération du reçu");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${payload.receiptNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className="rounded border px-2 py-1 text-xs" disabled={busy} onClick={download} type="button">
      {busy ? "..." : "Re-générer reçu PDF"}
    </button>
  );
}
