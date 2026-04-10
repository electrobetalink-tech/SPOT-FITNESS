import { differenceInCalendarDays, endOfDay, formatISO, startOfDay } from "date-fns";
import { NextResponse } from "next/server";
import type { ScanResult } from "@/lib/scan/types";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ScanPayload = {
  qrData?: string;
};

type UserRow = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name" | "email" | "qr_code">;
type SubscriptionRow = Pick<
  Database["public"]["Tables"]["subscriptions"]["Row"],
  "status" | "end_date"
>;
type AttendanceRow = Pick<Database["public"]["Tables"]["attendances"]["Row"], "check_in_date">;

function extractUserId(qrData: string) {
  const trimmed = qrData.trim();

  try {
    const parsed = JSON.parse(trimmed) as { user_id?: string; userId?: string; id?: string };
    return parsed.user_id ?? parsed.userId ?? parsed.id ?? trimmed;
  } catch {
    return trimmed;
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as ScanPayload;

  if (!body.qrData) {
    return NextResponse.json({ error: "QR code invalide." }, { status: 400 });
  }

  const supabase = createClient();
  const userId = extractUserId(body.qrData);

  const userResponse = await supabase.from("users").select("id, name, email, qr_code").eq("id", userId).maybeSingle();
  const user = userResponse.data as UserRow | null;

  if (userResponse.error || !user) {
    return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });
  }

  if (user.qr_code !== body.qrData.trim()) {
    return NextResponse.json(
      { error: "QR non valide. Possibilité de fraude détectée." },
      { status: 403 }
    );
  }

  const subscriptionResponse = await supabase
    .from("subscriptions")
    .select("status, end_date")
    .eq("user_id", user.id)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  const subscription = subscriptionResponse.data as SubscriptionRow | null;

  if (subscriptionResponse.error || !subscription) {
    return NextResponse.json({ error: "Aucun abonnement trouvé." }, { status: 404 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const todayAttendanceResponse = await supabase
    .from("attendances")
    .select("check_in_date")
    .eq("user_id", user.id)
    .gte("check_in_date", formatISO(todayStart))
    .lte("check_in_date", formatISO(todayEnd))
    .limit(1)
    .maybeSingle();

  const lastCheckInResponse = await supabase
    .from("attendances")
    .select("check_in_date")
    .eq("user_id", user.id)
    .order("check_in_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastCheckIn = lastCheckInResponse.data as AttendanceRow | null;

  const endDate = new Date(subscription.end_date);
  const status = endDate < todayStart && subscription.status === "active" ? "expired" : subscription.status;

  const result: ScanResult = {
    user: {
      name: user.name,
      email: user.email
    },
    subscription: {
      status,
      end_date: subscription.end_date,
      days_remaining: differenceInCalendarDays(endDate, todayStart),
      can_access_today: !todayAttendanceResponse.data
    },
    last_check_in: lastCheckIn?.check_in_date
  };

  return NextResponse.json(result);
}
