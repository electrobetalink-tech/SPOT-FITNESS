"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/contexts/ToastContext";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type ExpiringSubscription = {
  id: string;
  end_date: string;
  users: { name: string; email: string } | { name: string; email: string }[] | null;
};

const badgeStyleByType: Record<NotificationItem["type"], string> = {
  success: "bg-emerald-100 text-emerald-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  warning: "bg-orange-100 text-orange-800"
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export default function AdminNotificationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<ExpiringSubscription[]>([]);
  const [pendingPayments, setPendingPayments] = useState<number>(0);

  const loadData = useCallback(async () => {
    setLoading(true);

    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(now.getDate() + 7);

    const nowDate = now.toISOString().split("T")[0];
    const futureDate = inSevenDays.toISOString().split("T")[0];

    const [notificationsRes, expiringRes, pendingRes] = await Promise.all([
      supabase.from("notifications").select("id, title, message, type, is_read, created_at, metadata").order("created_at", { ascending: false }),
      supabase
        .from("subscriptions")
        .select("id, end_date, users!inner(name, email)")
        .in("status", ["active", "pending_payment"])
        .gte("end_date", nowDate)
        .lte("end_date", futureDate)
        .order("end_date", { ascending: true }),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "pending_payment")
    ]);

    if (notificationsRes.error) {
      showToast({
        title: "Erreur notifications",
        message: notificationsRes.error.message,
        variant: "error"
      });
    } else {
      setNotifications((notificationsRes.data ?? []) as NotificationItem[]);
    }

    if (expiringRes.error) {
      showToast({
        title: "Erreur abonnements",
        message: expiringRes.error.message,
        variant: "error"
      });
    } else {
      setExpiringSubscriptions((expiringRes.data ?? []) as ExpiringSubscription[]);
    }

    if (pendingRes.error) {
      showToast({
        title: "Erreur paiements",
        message: pendingRes.error.message,
        variant: "error"
      });
    } else {
      setPendingPayments(pendingRes.count ?? 0);
    }

    setLoading(false);
  }, [showToast, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  async function markAsRead(id: string) {
    const { error } = await (supabase.from("notifications") as any).update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      showToast({
        title: "Impossible de marquer comme lue",
        message: error.message,
        variant: "error"
      });
      return;
    }

    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, is_read: true } : item)));

    showToast({
      title: "Notification mise à jour",
      variant: "success"
    });
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((item) => !item.is_read).map((item) => item.id);

    if (unreadIds.length === 0) {
      showToast({
        title: "Aucune notification non lue",
        variant: "info"
      });
      return;
    }

    const { error } = await (supabase.from("notifications") as any).update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .in("id", unreadIds);

    if (error) {
      showToast({
        title: "Erreur de mise à jour",
        message: error.message,
        variant: "error"
      });
      return;
    }

    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));

    showToast({
      title: "Toutes les notifications sont marquées comme lues",
      variant: "success"
    });
  }

  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Centre de notifications</h1>
            <p className="mt-1 text-slate-600">Historique des alertes, rappels et paiements en attente.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative inline-flex items-center rounded-full border bg-white px-3 py-2 text-sm font-medium text-slate-700">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
              {unreadCount > 0 ? (
                <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{unreadCount}</span>
              ) : null}
            </div>

            <button
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => void markAllAsRead()}
              type="button"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Tout marquer lu
            </button>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Abonnements expirant bientôt (7 jours)</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {loading ? (
                <li className="text-slate-500">Chargement...</li>
              ) : expiringSubscriptions.length === 0 ? (
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
            <h2 className="text-lg font-semibold">Alertes paiements en attente</h2>
            <p className="mt-3 text-sm text-slate-700">
              {pendingPayments} abonnement{pendingPayments > 1 ? "s" : ""} en statut <strong>pending_payment</strong>.
            </p>
            <Link
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
              href="/payments"
            >
              Ouvrir la page des paiements
              <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </article>
        </section>

        <section className="mt-6 rounded-xl border bg-white shadow-sm">
          <header className="border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Historique des notifications</h2>
          </header>

          <ul className="divide-y">
            {loading ? (
              <li className="px-4 py-6 text-sm text-slate-500">Chargement de l'historique...</li>
            ) : notifications.length === 0 ? (
              <li className="px-4 py-6 text-sm text-slate-500">Aucune notification disponible.</li>
            ) : (
              notifications.map((item) => (
                <li className="flex flex-wrap items-start justify-between gap-3 px-4 py-4" key={item.id}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyleByType[item.type]}`}>{item.type}</span>
                      {!item.is_read ? <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">non lu</span> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatDate(item.created_at)}</p>
                  </div>

                  {!item.is_read ? (
                    <button
                      className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => void markAsRead(item.id)}
                      type="button"
                    >
                      Marquer comme lue
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
    </ProtectedRoute>
  );
}
