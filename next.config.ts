import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: false,
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  experimental: {
    webpackBuildWorker: false,
  }
};

export default nextConfig;
