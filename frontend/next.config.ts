import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ['*.space-z.ai', 'localhost'],
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
