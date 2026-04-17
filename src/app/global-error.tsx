"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-900">
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-3xl font-bold">Erreur critique</h1>
          <p className="max-w-lg text-slate-600">{error.message || "Une erreur est survenue dans l'application."}</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            Relancer l'application
          </button>
        </main>
      </body>
    </html>
  );
}
