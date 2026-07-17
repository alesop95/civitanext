"use client";

import "leaflet/dist/leaflet.css";
import "@/components/leafletDefaultIcon";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

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
