import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";

    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
