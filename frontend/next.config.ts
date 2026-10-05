import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "")
    : "https://pathlab-api.onrender.com");

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
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
      {
        source: "/api-docs/:path*",
        destination: `${backendUrl}/api-docs/:path*`,
      },
    ];
  },
};

export default nextConfig;
