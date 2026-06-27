import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
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
    ],
  },
};

export default nextConfig;
