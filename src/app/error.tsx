"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">Une erreur est survenue</h1>
      <p className="max-w-lg text-slate-600">{error.message || "Veuillez réessayer dans quelques instants."}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
      >
        Réessayer
      </button>
    </main>
  );
}
