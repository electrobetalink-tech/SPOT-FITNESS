import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">SPOT FITNESS</h1>
      <p className="mt-2 text-slate-600">
        Base du projet Next.js 14 + Supabase pour la gestion des abonnements en espèces.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Link className="rounded-xl border bg-white p-4 hover:border-brand" href="/dashboard">
          Espace SuperAdmin
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:border-brand" href="/profile">
          Espace abonné
        </Link>
      </section>
    </main>
  );
}
