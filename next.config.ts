import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project has its own lockfile; pin the workspace root to avoid Next.js
  // picking up a parent lockfile in ~/Documents.
  turbopack: { root: __dirname },
};

export default nextConfig;
