// Estrae l'id di un video YouTube da un URL o lo accetta gia' come id nudo, cosi' l'admin puo'
// incollare direttamente il link della pagina. Nessuna chiamata di rete: la validita' reale del
// video (esiste, e' davvero "non in elenco" e non privato) si scopre alla prima visualizzazione
// dell'embed, stesso principio "verifica al momento dell'uso" gia' visto per Nominatim
// (refactor-12), non qualcosa che vale la pena controllare qui.
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function extractYoutubeId(input: string): string | null {
  const value = input.trim();
  if (YOUTUBE_ID_PATTERN.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1);
    return YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  if (url.hostname === "youtube.com" || url.hostname.endsWith(".youtube.com")) {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }
    if (url.pathname.startsWith("/embed/")) {
      const id = url.pathname.slice("/embed/".length);
      return YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }
  }

  return null;
}

// youtube-nocookie.com: il domino a privacy avanzata di YouTube per gli embed, coerente con lo
// spirito "non in elenco pubblico" dei video (ADR-004/ADR-017).
export function youtubeEmbedUrl(youtubeId: string) {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
}

export function youtubeThumbnailUrl(youtubeId: string) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}
