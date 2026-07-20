import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma non va incluso nel bundle di Next: deve restare un modulo esterno
  // caricato a runtime, come richiesto dall'adapter OpenNext per Cloudflare Workers.
  // pg-cloudflare (dipendenza opzionale di pg, usata da @prisma/adapter-pg): il suo export
  // condizionale "workerd" punta a un file che il tracciamento di Next (nft, condizioni di
  // default, non "workerd") non copia nel bundle standalone; il passo di bundling di OpenNext
  // lo cerca poi con la condizione "workerd" e non lo trova (verificato in CI). Esterno anche
  // lui, come pg stesso (gia' nella lista di default di Next), cosi' l'intero pacchetto viene
  // copiato invece che tracciato file per file sotto condizioni diverse.
  serverExternalPackages: ["@prisma/client", ".prisma/client", "pg-cloudflare"],
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
