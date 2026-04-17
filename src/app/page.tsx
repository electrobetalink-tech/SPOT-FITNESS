import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export default async function HomePage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const role = ((data as { role?: UserRole } | null)?.role ?? "member") as UserRole;

  if (role === "superadmin") {
    redirect("/admin/dashboard");
  }

  redirect("/member/dashboard");
}
