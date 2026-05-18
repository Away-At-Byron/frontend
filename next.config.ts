import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Standalone output so the backend repo's Dockerfile can ship a slim runtime image.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Server Actions are the primary mutation boundary (see CLAUDE.md rule 5).
    serverActions: { bodySizeLimit: "2mb" },
  },
  // Health/integration route handlers must run on the Node runtime (pg, pg-boss).
  serverExternalPackages: ["pg", "pg-boss"],
}

export default nextConfig
