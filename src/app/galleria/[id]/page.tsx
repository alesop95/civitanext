import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { FileField } from "@/components/ui/FileField";
import { uploadPhoto } from "../actions";

export default async function AlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await auth();
  const prisma = getPrisma();

  const album = await prisma.photoAlbum.findUnique({
    where: { id },
    include: {
      event: { select: { title: true } },
      photos: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!album) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/galleria" />

      <Link href="/galleria" className="font-ui text-sm text-ink-soft underline">
        &larr; Torna alla galleria
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-black">{album.title}</h1>
        {album.event && (
          <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
            {album.event.title}
          </p>
        )}
        <p className="font-ui text-sm text-ink-soft">{album.photos.length} foto</p>
      </header>

      {error && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          Una o più foto non sono state caricate: solo immagini JPEG, PNG o WEBP, fino a 8 MB.
        </p>
      )}

      {album.photos.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessuna foto in questo album ancora.</p>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {album.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element -- URL pubblico R2, non gestito da next/image
            <img
              key={photo.id}
              src={`${process.env.R2_PUBLIC_BASE_URL}/${photo.r2Key}`}
              alt={album.title}
              className="aspect-square w-full rounded-cn border-2 border-ink object-cover shadow-hard"
            />
          ))}
        </section>
      )}

      {session?.user ? (
        <form
          action={uploadPhoto.bind(null, album.id)}
          className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard"
        >
          <FileField
            name="photos"
            label="Carica foto"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
            buttonLabel="Scegli foto"
          />
          <Btn type="submit" kind="primary" className="self-start">
            Carica
          </Btn>
        </form>
      ) : (
        <Link
          href={`/accedi?callbackUrl=${encodeURIComponent(`/galleria/${album.id}`)}`}
          className={btnClassName({ kind: "secondary" })}
        >
          Accedi per caricare foto
        </Link>
      )}
    </main>
  );
}
