import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
