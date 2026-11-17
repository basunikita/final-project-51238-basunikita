import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The project proposal is a static page in public/proposal/, submitted at /proposal.
  async rewrites() {
    return [
      { source: "/proposal", destination: "/proposal/index.html" },
      { source: "/proposal/", destination: "/proposal/index.html" },
    ];
  },
};

export default nextConfig;
