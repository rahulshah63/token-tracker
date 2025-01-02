import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "r.turbos.finance",
        pathname: "/icon/**",
      },
    ],
  },
};

export default nextConfig;
