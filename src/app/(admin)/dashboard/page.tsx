import { StatusBadge } from "@/components/status-badge";

const mockMembers = [
  { name: "Nadia Benali", status: "actif", daysLeft: 24 },
  { name: "Yassine D.", status: "en_attente", daysLeft: 0 },
  { name: "Samir L.", status: "expire", daysLeft: -3 }
] as const;

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Dashboard SuperAdmin</h1>
      <p className="mt-1 text-slate-600">Gestion des abonnements, validations espèces, scan QR et historique.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {mockMembers.map((member) => (
          <article className="rounded-xl border bg-white p-4 shadow-sm" key={member.name}>
            <h2 className="font-semibold">{member.name}</h2>
            <div className="mt-3">
              <StatusBadge status={member.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">Durée restante: {member.daysLeft} jours</p>
          </article>
        ))}
      </div>
    </main>
  );
}
