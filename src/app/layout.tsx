import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPOT FITNESS",
  description: "Gestion de salle de musculation avec abonnements en espèces"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
