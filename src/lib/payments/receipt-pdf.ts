import type { ReceiptPayload } from "./types";

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildContentLines(payload: ReceiptPayload) {
  return [
    "BT /F1 18 Tf 40 800 Td",
    `(${escapePdfText(payload.gymName)}) Tj`,
    "ET",
    "BT /F1 12 Tf 40 775 Td",
    "(Recu de paiement especes) Tj",
    "ET",
    "BT /F1 11 Tf 40 755 Td",
    `(Numero recu: ${escapePdfText(payload.receiptNumber)}) Tj`,
    "ET",
    "BT /F1 11 Tf 40 725 Td",
    `(Membre: ${escapePdfText(payload.memberName)}) Tj`,
    "ET",
    "BT /F1 11 Tf 40 705 Td",
    `(Montant: ${escapePdfText(payload.amountPaid.toFixed(2))} MAD) Tj`,
    "ET",
    "BT /F1 11 Tf 40 685 Td",
    `(Abonnement: ${escapePdfText(payload.subscriptionType)}) Tj`,
    "ET",
    "BT /F1 11 Tf 40 665 Td",
    `(Date paiement: ${escapePdfText(payload.paymentDate)}) Tj`,
    "ET",
    "BT /F1 11 Tf 40 645 Td",
    `(Validite: ${escapePdfText(payload.validityStartDate)} -> ${escapePdfText(payload.validityEndDate)}) Tj`,
    "ET",
    ...(payload.notes
      ? [
          "BT /F1 11 Tf 40 625 Td",
          `(Notes: ${escapePdfText(payload.notes)}) Tj`,
          "ET"
        ]
      : []),
    "BT /F1 11 Tf 40 590 Td",
    `(Signature SuperAdmin: ${escapePdfText(payload.superAdminSignature)}) Tj`,
    "ET"
  ].join("\n");
}

export function buildReceiptPdf(payload: ReceiptPayload) {
  const content = buildContentLines(payload);
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
    `5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
