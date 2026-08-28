import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      // Every Cartzii host, wildcarded. Each deployment serves its own images
      // from its own API — qa-api.cartzii.ca, api.cartzii.com and so on — and
      // none of those were listed, so next/image rejected them outright with
      // "url parameter is not allowed" (HTTP 400). Only the old shared
      // staging-api host was allowed, which is why this went unnoticed.
      { protocol: "https", hostname: "**.cartzii.ca" },
      { protocol: "https", hostname: "**.cartzii.com" },
      { protocol: "https", hostname: "staging-api.cartzii.com" },
      { protocol: "https", hostname: "pub-e0f1bdc809544c0cb31dcf32dd668394.r2.dev" },
    ],
  },
};

export default withNextIntl(nextConfig);
