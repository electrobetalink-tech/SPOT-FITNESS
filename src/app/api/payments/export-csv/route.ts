import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const member = url.searchParams.get("member");
  const amountMin = url.searchParams.get("amountMin");
  const amountMax = url.searchParams.get("amountMax");

  const supabase = createClient();
  let query = supabase
    .from("payment_transactions")
    .select("amount,payment_date,receipt_number,notes,users!inner(name),subscriptions!inner(plan_type)")
    .order("payment_date", { ascending: false });

  if (dateFrom) query = query.gte("payment_date", `${dateFrom}T00:00:00Z`);
  if (dateTo) query = query.lte("payment_date", `${dateTo}T23:59:59Z`);
  if (amountMin) query = query.gte("amount", Number(amountMin));
  if (amountMax) query = query.lte("amount", Number(amountMax));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? [])
    .map((row: any) => {
      const user = Array.isArray(row.users) ? row.users[0] : row.users;
      const subscription = Array.isArray(row.subscriptions) ? row.subscriptions[0] : row.subscriptions;
      return {
        payment_date: row.payment_date,
        member_name: user?.name ?? "",
        amount: Number(row.amount).toFixed(2),
        plan_type: subscription?.plan_type ?? "",
        receipt_number: row.receipt_number,
        notes: row.notes ?? ""
      };
    })
    .filter((row: any) => {
      if (!member) return true;
      return row.member_name.toLowerCase().includes(member.toLowerCase());
    });

  const csvHeader = "Date,Membre,Montant,Forfait,NumeroRecu,Notes";
  const csvRows = rows.map((row: any) =>
    [row.payment_date, row.member_name, row.amount, row.plan_type, row.receipt_number, row.notes]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );

  const csv = [csvHeader, ...csvRows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="payments-history.csv"'
    }
  });
}
