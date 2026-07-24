"use client";

import { useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "@/components/leafletDefaultIcon";
import type { Marker as LeafletMarker } from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

const CIVITANOVA_CENTER: [number, number] = [43.3095, 13.7278];

// Cinque decimali ~ un metro: precisione più che sufficiente per un pin cittadino, e valori
// leggibili nei campi invece della coda di 13 cifre che un clic produrrebbe.
function roundCoord(value: number): string {
  return String(Math.round(value * 1e5) / 1e5);
}

// useMapEvents funziona solo in un componente figlio di MapContainer: questo componente non
// renderizza nulla, esiste solo per agganciare il clic della mappa.
function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

interface NominatimReverse {
  name?: string;
  display_name?: string;
  address?: Record<string, string>;
}

// Geocodifica inversa con Nominatim (OpenStreetMap): nessun account né chiave, in linea con
// ADR-013; la policy d'uso chiede al massimo una richiesta al secondo, ritmo che un form
// amministrativo rispetta per natura (una richiesta per clic). Il fallimento è non bloccante:
// i campi restano compilabili a mano.
async function reverseGeocode(lat: number, lng: number, signal: AbortSignal) {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=it&zoom=18" +
    `&lat=${lat}&lon=${lng}`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Nominatim ${response.status}`);
  return (await response.json()) as NominatimReverse;
}

function placeFromAddress(data: NominatimReverse): string {
  const address = data.address ?? {};
  const road = address.road ?? address.pedestrian ?? address.square ?? "";
  if (road) return address.house_number ? `${road} ${address.house_number}` : road;
  return data.display_name?.split(",")[0]?.trim() ?? "";
}

export type MapPointDefaults = {
  title: string;
  type: string;
  place: string;
  lat: string;
  lng: string;
};

// Possiede tutti i campi del form (name inclusi, così la server action li riceve invariati):
// il clic sulla mappa compila le coordinate e, via Nominatim, luogo e titolo; un campo scritto
// a mano diventa "suo" dell'utente e l'automatismo smette di toccarlo. In modifica riceve i
// valori esistenti come `defaults` e li considera gia' "scritti a mano" (dirty), cosi' un
// eventuale nuovo clic sposta il pin ma non sovrascrive il titolo/luogo gia' impostati.
export function MapPointPicker({ defaults }: { defaults?: MapPointDefaults }) {
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [type, setType] = useState(defaults?.type ?? "");
  const [place, setPlace] = useState(defaults?.place ?? "");
  const [lat, setLat] = useState(defaults?.lat ?? "");
  const [lng, setLng] = useState(defaults?.lng ?? "");
  const [lookup, setLookup] = useState<"idle" | "loading" | "error">("idle");
  const titleDirty = useRef(defaults !== undefined);
  const placeDirty = useRef(defaults !== undefined);
  const inFlight = useRef<AbortController | null>(null);

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const hasMarker =
    lat !== "" &&
    lng !== "" &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180;

  const pick = (nextLat: number, nextLng: number) => {
    setLat(roundCoord(nextLat));
    setLng(roundCoord(nextLng));

    // Un nuovo clic annulla la richiesta precedente ancora in volo: vince sempre l'ultimo
    // punto scelto, mai una risposta arrivata in ritardo.
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setLookup("loading");

    reverseGeocode(nextLat, nextLng, controller.signal)
      .then((data) => {
        if (!placeDirty.current) {
          const nextPlace = placeFromAddress(data);
          if (nextPlace) setPlace(nextPlace);
        }
        if (!titleDirty.current && data.name) setTitle(data.name);
        setLookup("idle");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLookup("error");
      });
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 font-ui text-sm">
        Titolo
        <input
          name="title"
          type="text"
          required
          value={title}
          onChange={(event) => {
            titleDirty.current = true;
            setTitle(event.target.value);
          }}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Tipo
        <input
          name="type"
          type="text"
          required
          placeholder="es. Evento, Proposta, Punto di interesse"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Luogo
        <input
          name="place"
          type="text"
          required
          placeholder="es. Piazza XX Settembre"
          value={place}
          onChange={(event) => {
            placeDirty.current = true;
            setPlace(event.target.value);
          }}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <div className="flex flex-col gap-1 font-ui text-sm">
        Posizione (clicca sulla mappa; il marker si può trascinare per aggiustare)
        <MapContainer
          center={CIVITANOVA_CENTER}
          zoom={14}
          scrollWheelZoom={false}
          className="h-[320px] w-full rounded-cn border-2 border-ink shadow-hard"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPick={pick} />
          {hasMarker && (
            <Marker
              position={[latNum, lngNum]}
              draggable
              eventHandlers={{
                dragend(event) {
                  const next = (event.target as LeafletMarker).getLatLng();
                  pick(next.lat, next.lng);
                },
              }}
            />
          )}
        </MapContainer>
        {lookup === "loading" && (
          <p className="font-ui text-xs text-ink-soft">Cerco l&apos;indirizzo del punto…</p>
        )}
        {lookup === "error" && (
          <p className="font-ui text-xs text-ink-soft">
            Indirizzo non trovato (servizio non raggiungibile): compila Luogo a mano.
          </p>
        )}
      </div>
      <div className="flex gap-4">
        <label className="flex flex-1 flex-col gap-1 font-ui text-sm">
          Latitudine
          <input
            name="lat"
            type="number"
            step="any"
            required
            placeholder="43.3095"
            value={lat}
            onChange={(event) => setLat(event.target.value)}
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 font-ui text-sm">
          Longitudine
          <input
            name="lng"
            type="number"
            step="any"
            required
            placeholder="13.7278"
            value={lng}
            onChange={(event) => setLng(event.target.value)}
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
      </div>
    </div>
  );
}
