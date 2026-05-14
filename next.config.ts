import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/records", destination: "/documents", permanent: true },
      {
        source: "/records/:path*",
        destination: "/documents/:path*",
        permanent: true,
      },
      {
        source: "/settings/records",
        destination: "/settings/documents",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
