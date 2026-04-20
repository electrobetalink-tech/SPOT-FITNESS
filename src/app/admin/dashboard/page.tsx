"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, LogOut, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ExpiringSubscription = {
  id: string;
  end_date: string;
  users: { name: string; email: string } | { name: string; email: string }[] | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { signOut, user } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<ExpiringSubscription[]>([]);

  useEffect(() => {
    async function loadNotificationWidget() {
      const now = new Date();
      const inSevenDays = new Date(now);
      inSevenDays.setDate(now.getDate() + 7);

      const today = now.toISOString().split("T")[0];
      const sevenDaysDate = inSevenDays.toISOString().split("T")[0];

      const [unreadRes, pendingRes, expiringRes] = await Promise.all([
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "pending_payment"),
        supabase
          .from("subscriptions")
          .select("id, end_date, users!inner(name, email)")
          .in("status", ["active", "pending_payment"])
          .gte("end_date", today)
          .lte("end_date", sevenDaysDate)
          .order("end_date", { ascending: true })
          .limit(5)
      ]);

      if (!unreadRes.error) {
        setUnreadCount(unreadRes.count ?? 0);
      }

      if (!pendingRes.error) {
        setPendingPayments(pendingRes.count ?? 0);
      }

      if (!expiringRes.error) {
        setExpiringSubscriptions((expiringRes.data ?? []) as ExpiringSubscription[]);
      }
    }

    void loadNotificationWidget();
  }, [supabase]);

  async function handleSignOut() {
    await signOut();
    router.replace("/auth/login");
  }

  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Dashboard SuperAdmin</h1>
            <p className="mt-2 text-slate-600">Connecté en tant que {user?.email}.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              className="relative inline-flex items-center rounded-full border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              href="/admin/notifications"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
              {unreadCount > 0 ? (
                <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{unreadCount}</span>
              ) : null}
            </Link>

            <button className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-white" onClick={handleSignOut} type="button">
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Abonnements expirant bientôt</h2>
            <p className="mt-1 text-sm text-slate-600">Membres dont l'abonnement arrive à expiration dans 7 jours.</p>

            <ul className="mt-3 space-y-2 text-sm">
              {expiringSubscriptions.length === 0 ? (
                <li className="text-slate-500">Aucun abonnement proche de l'expiration.</li>
              ) : (
                expiringSubscriptions.map((subscription) => {
                  const member = Array.isArray(subscription.users) ? subscription.users[0] : subscription.users;

                  return (
                    <li className="rounded-md border border-orange-100 bg-orange-50 px-3 py-2" key={subscription.id}>
                      <p className="font-medium text-orange-900">{member?.name ?? "Membre"}</p>
                      <p className="text-orange-800">{member?.email ?? "-"}</p>
                      <p className="text-orange-700">Expire le {new Date(subscription.end_date).toLocaleDateString("fr-FR")}</p>
                    </li>
                  );
                })
              )}
            </ul>
          </article>

          <article className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Paiements en attente</h2>
            <p className="mt-2 text-sm text-slate-700">
              {pendingPayments} abonnement{pendingPayments > 1 ? "s" : ""} en statut <strong>pending_payment</strong>.
            </p>
            <Link className="mt-4 inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800" href="/payments">
              Ouvrir la validation des paiements
              <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </article>
        </section>
      </main>
    </ProtectedRoute>
  );
}
