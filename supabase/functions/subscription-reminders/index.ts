// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type SubscriptionReminderRow = {
  id: string;
  end_date: string;
  users: {
    id: string;
    email: string;
    name: string;
  } | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
const emailFrom = Deno.env.get("REMINDER_EMAIL_FROM") ?? "SPOT FITNESS <noreply@spotfitness.app>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

async function sendEmail(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY absent: email not sent", { to, subject });
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: emailFrom,
      to,
      subject,
      html
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Variables SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const targetDate = new Date();
    targetDate.setUTCDate(targetDate.getUTCDate() + 7);
    const targetDateISO = targetDate.toISOString().split("T")[0];

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("subscriptions")
      .select("id, end_date, users!inner(id, email, name)")
      .eq("status", "active")
      .eq("end_date", targetDateISO);

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    const expiringSoon = (subscriptions ?? []) as SubscriptionReminderRow[];

    const { data: superAdmins, error: superAdminError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("role", "superadmin");

    if (superAdminError) {
      throw superAdminError;
    }

    for (const row of expiringSoon) {
      if (!row.users?.email) {
        continue;
      }

      const memberName = row.users.name;
      const subject = "Rappel: votre abonnement expire dans 7 jours";
      const message = `Bonjour ${memberName}, votre abonnement SPOT FITNESS expire le ${row.end_date}. Pensez à le renouveler pour conserver votre accès.`;

      await sendEmail(
        row.users.email,
        subject,
        `<p>${message}</p><p>Connectez-vous à votre espace membre pour demander un renouvellement.</p>`
      );

      await supabase.from("notifications").insert({
        user_id: row.users.id,
        title: "Abonnement bientôt expiré",
        message,
        type: "warning",
        metadata: {
          subscription_id: row.id,
          end_date: row.end_date,
          source: "daily_subscription_reminder"
        }
      });

      for (const admin of superAdmins ?? []) {
        const adminMessage = `${memberName} (${row.users.email}) expire le ${row.end_date}.`;

        await sendEmail(
          admin.email,
          "Alerte SuperAdmin: abonnement expirant dans 7 jours",
          `<p>${adminMessage}</p><p>Action recommandée: contacter le membre.</p>`
        );

        await supabase.from("notifications").insert({
          user_id: admin.id,
          title: "Rappel abonnement membre",
          message: adminMessage,
          type: "info",
          metadata: {
            subscription_id: row.id,
            member_id: row.users.id,
            end_date: row.end_date,
            source: "daily_subscription_reminder"
          }
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        targetDate: targetDateISO,
        remindersProcessed: expiringSoon.length,
        adminsNotified: superAdmins?.length ?? 0
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
