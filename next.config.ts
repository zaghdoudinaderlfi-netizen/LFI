import type { NextConfig } from "next";

// Construit l'URL exacte de ce Codespace depuis les variables d'env GitHub Codespaces.
// Garantit que la config reste valide après chaque redémarrage sans URL codée en dur.
function originesCodespace(): string[] {
  const nom = process.env.CODESPACE_NAME;
  const domaine =
    process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? "app.github.dev";
  if (!nom) return [];
  return [`${nom}-3000.${domaine}`];
}

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

export default nextConfig;
