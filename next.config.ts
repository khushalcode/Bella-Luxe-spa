import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow dev requests from the chat preview proxy.
  // The proxy forwards with a different x-forwarded-host header;
  // without this, Next.js blocks server actions with "Invalid Server Actions request".
  allowedDevOrigins: [
    "*.space-z.ai",
    "*.fcapp.run",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
