import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
