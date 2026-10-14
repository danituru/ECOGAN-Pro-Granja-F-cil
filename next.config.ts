import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-lib"],
  // El justificante de ECOGAN (PDF de hasta 4 MB) lo sube el operador con una server action.
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};

export default withNextIntl(nextConfig);
