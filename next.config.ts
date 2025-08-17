import { withNextVideo } from "next-video/process";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don’t fail the production build on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don’t fail the production build on TS errors
    ignoreBuildErrors: true,
  },
};

export default withNextVideo(nextConfig);