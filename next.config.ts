import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${process.env.API_INTERNAL_BASE_URL || "http://localhost:6000/api"}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9100",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9100",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.101.10",
        port: "9200",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.101.12",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "86.48.3.184",
        port: "9200",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "86.48.3.184",
        port: "9000",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
