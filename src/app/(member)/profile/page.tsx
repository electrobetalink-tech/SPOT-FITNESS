export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Mon profil</h1>
      <p className="mt-2 text-slate-600">Votre QR code unique et les informations d'abonnement apparaîtront ici.</p>

      <div className="mt-6 rounded-xl border bg-white p-4">
        <p className="text-sm text-slate-500">QR code (placeholder)</p>
        <div className="mt-3 h-40 w-40 rounded-lg bg-slate-100" />
      </div>
    </main>
  );
}
