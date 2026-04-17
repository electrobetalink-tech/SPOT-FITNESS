import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/error-boundary";
import { buildMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = buildMetadata({
  title: "Gestion de salle",
  description: "Gestion des abonnements, paiements, présences et reçus pour SPOT FITNESS.",
  path: "/"
});

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
