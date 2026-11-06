import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  devIndicators: false,
  serverExternalPackages: ["pdfkit", "@prisma/client", "bcryptjs"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  allowedDevOrigins: [
    "ais-dev-n2bn65h7lbp2bc6stt4szh-215895254497.asia-southeast1.run.app",
    "ais-pre-n2bn65h7lbp2bc6stt4szh-215895254497.asia-southeast1.run.app",
    "localhost:3000",
    "localhost:8080",
    "127.0.0.1:3000",
    "127.0.0.1:8080",
  ],
};

export default nextConfig;
