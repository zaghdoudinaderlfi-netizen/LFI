import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.app.github.dev",
        "*.preview.app.github.dev",
        "*.githubpreview.dev",
        // URL exacte de ce Codespace (change à chaque redémarrage → les wildcards ci-dessus suffisent)
        "super-duper-space-doodle-5gw9w5pp4gj63v675-3000.app.github.dev",
      ],
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
