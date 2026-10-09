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
  // Vercel/serverless: data/*.json derleme sırasında (prebuild → sync:cards) üretilir ve
  // sunucu fonksiyonlarının paketine dahil edilir; çalışma zamanında fs'ten okunur.
  outputFileTracingIncludes: {
    "/*": ["./data/*.json"],
  },
};

export default nextConfig;
