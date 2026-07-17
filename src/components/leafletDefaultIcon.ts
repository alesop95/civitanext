import L from "leaflet";

// Le icone di default di Leaflet puntano a percorsi che il bundler non risolve (bug noto di
// Leaflet con qualunque bundler moderno, non solo Next.js): si sovrascrivono con le stesse
// immagini copiate in public/leaflet, self-hostate per non dipendere da un CDN esterno a
// runtime (coerente con l'impostazione PWA offline-first del progetto). Modulo a solo effetto
// collaterale, importato da ogni componente client che crea marker Leaflet.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});
