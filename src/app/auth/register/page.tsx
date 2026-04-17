"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, role, user, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      router.replace(role === "superadmin" ? "/admin/dashboard" : "/member/dashboard");
    }
  }, [loading, role, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await signUp({
        name,
        email,
        password,
        phone: phone || null
      });

      router.replace("/");
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : "Erreur lors de l'inscription.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-6">
      <div className="w-full rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Inscription</h1>
        <p className="mt-1 text-sm text-slate-600">Créez votre compte membre et générez votre QR code.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1 text-sm">
            <span>Nom complet</span>
            <input
              className="w-full rounded-md border p-2"
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
              value={name}
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Email</span>
            <input
              className="w-full rounded-md border p-2"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Téléphone (optionnel)</span>
            <input
              className="w-full rounded-md border p-2"
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              value={phone}
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Mot de passe</span>
            <input
              className="w-full rounded-md border p-2"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Déjà un compte ?{" "}
          <Link className="font-medium text-blue-700 hover:underline" href="/auth/login">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
