import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
      {
        source: "/health",
        destination: "http://localhost:5000/health",
      },
      {
        source: "/api-docs/:path*",
        destination: "http://localhost:5000/api-docs/:path*",
      },
    ];
  },
};

export default nextConfig;
