import { NewSubscriptionForm } from "@/components/subscribers/new-subscription-form";

export default function NewSubscriberPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Nouveau membre / abonnement</h1>
      <p className="mt-1 text-slate-600">Créez un abonnement en 2 étapes puis redirigez vers l'encaissement.</p>
      <NewSubscriptionForm />
    </main>
  );
}
