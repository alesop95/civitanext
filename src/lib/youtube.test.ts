import { describe, expect, it } from "vitest";
import { extractYoutubeId, youtubeEmbedUrl, youtubeThumbnailUrl } from "./youtube";

const ID = "dQw4w9WgXcQ";

describe("extractYoutubeId", () => {
  it("accetta l'id nudo", () => {
    expect(extractYoutubeId(ID)).toBe(ID);
  });

  it("estrae l'id da un link youtu.be", () => {
    expect(extractYoutubeId(`https://youtu.be/${ID}`)).toBe(ID);
  });

  it("estrae l'id da un link youtube.com/watch?v=", () => {
    expect(extractYoutubeId(`https://www.youtube.com/watch?v=${ID}&t=30s`)).toBe(ID);
  });

  it("estrae l'id da un link youtube.com/embed/", () => {
    expect(extractYoutubeId(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
  });

  it("rigetta un URL di un altro sito", () => {
    expect(extractYoutubeId("https://vimeo.com/12345678")).toBeNull();
  });

  it("rigetta testo che non e' ne' un id ne' un URL", () => {
    expect(extractYoutubeId("non un link")).toBeNull();
  });
});

describe("youtubeEmbedUrl e youtubeThumbnailUrl", () => {
  it("compongono gli URL a partire dal solo id, sul dominio a privacy avanzata", () => {
    expect(youtubeEmbedUrl(ID)).toBe(`https://www.youtube-nocookie.com/embed/${ID}`);
    expect(youtubeThumbnailUrl(ID)).toBe(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
  });
});
