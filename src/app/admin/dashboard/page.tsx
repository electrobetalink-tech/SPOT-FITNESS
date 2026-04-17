"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { signOut, user } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.replace("/auth/login");
  }

  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">Dashboard SuperAdmin</h1>
        <p className="mt-2 text-slate-600">Connecté en tant que {user?.email}.</p>

        <button className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-white" onClick={handleSignOut} type="button">
          Se déconnecter
        </button>
      </main>
    </ProtectedRoute>
  );
}
