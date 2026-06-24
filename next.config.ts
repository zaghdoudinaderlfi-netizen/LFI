import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// Construit l'URL exacte de ce Codespace depuis les variables d'env GitHub Codespaces.
// Garantit que la config reste valide après chaque redémarrage sans URL codée en dur.
function originesCodespace(): string[] {
  const nom = process.env.CODESPACE_NAME;
  const domaine =
    process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? "app.github.dev";
  if (!nom) return [];
  return [`${nom}-3000.${domaine}`];
}

const withPWA = withPWAInit({
  dest: "public",
  // Désactive le SW en dev pour ne pas interférer avec le hot-reload
  disable: process.env.NODE_ENV === "development",
  // Cache uniquement les ressources statiques (JS, CSS, images, fonts)
  // Les pages dynamiques et les routes API ne sont jamais mises en cache
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  workboxOptions: {
    // N'intercepte que les ressources statiques du build Next.js
    // Les routes d'auth, API et pages dynamiques passent toujours par le réseau
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
    ],
    // Exclut explicitement les routes sensibles du précache
    exclude: [
      /\/api\//,
      /\/auth\//,
      /\/_next\/data\//,
    ],
  },
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.app.github.dev",
        "*.preview.app.github.dev",
        "*.githubpreview.dev",
        ...originesCodespace(),
      ],
      bodySizeLimit: "10mb",
    },
  },
};

export default withPWA(nextConfig);
