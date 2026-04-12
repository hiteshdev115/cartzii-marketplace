import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "staging-api.cartzii.com" },
      { protocol: "https", hostname: "pub-e0f1bdc809544c0cb31dcf32dd668394.r2.dev" },
    ],
  },
};

export default withNextIntl(nextConfig);
