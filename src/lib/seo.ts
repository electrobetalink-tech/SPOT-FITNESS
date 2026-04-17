import type { Metadata } from "next";

const APP_NAME = "SPOT FITNESS";
const DEFAULT_DESCRIPTION = "Plateforme de gestion de salle de musculation avec abonnements en espèces et suivi des paiements.";

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function buildMetadata({
  title,
  description,
  path = "/",
  noIndex = false
}: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const baseUrl = getBaseUrl();
  const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonical = new URL(path, baseUrl).toString();

  return {
    title: fullTitle,
    description: metaDescription,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical
    },
    openGraph: {
      title: fullTitle,
      description: metaDescription,
      url: canonical,
      siteName: APP_NAME,
      locale: "fr_FR",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: metaDescription
    },
    robots: {
      index: !noIndex,
      follow: !noIndex
    }
  };
}
