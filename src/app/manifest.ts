import type { MetadataRoute } from "next";

// Convenzione ufficiale di Next.js (app/manifest.ts): il framework genera e collega da solo
// il manifest, nessun <link rel="manifest"> manuale nel layout (verificato nei docs bundled
// in node_modules/next/dist/docs, non assunto dalla versione precedente di Next).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CivitaNext",
    short_name: "CivitaNext",
    description:
      "Piattaforma di partecipazione civica per l'associazione di giovani cittadini di Civitanova Marche.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f0e4",
    theme_color: "#e8503a",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
