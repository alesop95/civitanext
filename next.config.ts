import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma non va incluso nel bundle di Next: deve restare un modulo esterno
  // caricato a runtime, come richiesto dall'adapter OpenNext per Cloudflare Workers.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
