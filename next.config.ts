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
  experimental: {
    // Default 1MB e' troppo poco per l'upload proxato della galleria foto (ADR-016): il body
    // della Server Action porta i byte dell'immagine, non solo campi di testo. Impostazione
    // globale per tutta l'app, non solo per l'upload foto; da ricalibrare quando si conoscono
    // volumi reali.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
