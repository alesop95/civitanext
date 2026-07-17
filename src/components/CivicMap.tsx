"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// Le icone di default di Leaflet puntano a percorsi che il bundler non risolve (bug noto di
// Leaflet con qualunque bundler moderno, non solo Next.js): si sovrascrivono con le stesse
// immagini copiate in public/leaflet, self-hostate per non dipendere da un CDN esterno a
// runtime (coerente con l'impostazione PWA offline-first del progetto).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

const CIVITANOVA_CENTER: [number, number] = [43.3095, 13.7278];

export interface CivicMapPoint {
  id: string;
  title: string;
  type: string;
  place: string;
  lat: number;
  lng: number;
}

export function CivicMap({ points }: { points: CivicMapPoint[] }) {
  return (
    <MapContainer
      center={CIVITANOVA_CENTER}
      zoom={14}
      scrollWheelZoom={false}
      className="h-[420px] w-full rounded-cn border-2 border-ink shadow-hard"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((point) => (
        <Marker key={point.id} position={[point.lat, point.lng]}>
          <Popup>
            <strong>{point.title}</strong>
            <br />
            {point.type} &middot; {point.place}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
