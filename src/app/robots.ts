import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/auth/login", "/auth/register"],
        disallow: ["/admin", "/member", "/api"]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
