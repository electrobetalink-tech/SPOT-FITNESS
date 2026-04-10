import { NextResponse } from "next/server";
import { buildReceiptPdf } from "@/lib/payments/receipt-pdf";
import type { ReceiptPayload } from "@/lib/payments/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as ReceiptPayload;
  const pdfBytes = buildReceiptPdf(payload);

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${payload.receiptNumber}.pdf"`
    }
  });
}
