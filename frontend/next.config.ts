import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cloudflare tunnel and local origins
  allowedDevOrigins: [
    "latex-lid-joseph-biotechnology.trycloudflare.com",
    "*.trycloudflare.com",
    "localhost:3000",
  ],
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
