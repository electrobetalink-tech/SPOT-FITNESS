"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/lib/supabase/types";

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
};

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      if (role === "superadmin") {
        router.replace("/admin/dashboard");
        return;
      }

      router.replace("/member/dashboard");
      return;
    }

    if (pathname.startsWith("/auth")) {
      if (role === "superadmin") {
        router.replace("/admin/dashboard");
        return;
      }

      if (role === "member") {
        router.replace("/member/dashboard");
      }
    }
  }, [allowedRoles, loading, pathname, role, router, user]);

  if (loading) {
    return <p className="p-6 text-sm text-slate-500">Chargement...</p>;
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
