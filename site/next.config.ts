import path from "node:path";
import type { NextConfig } from "next";

// Static export: `npm run build` writes plain HTML to out/, served by nginx like the old site.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // The repo root is the project root, so globals.css can import the shared assets/site-system.css.
  turbopack: { root: path.join(__dirname, "..") },
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
