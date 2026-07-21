import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { btnClassName } from "@/components/ui/Btn";

export default async function GalleriaPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const prisma = getPrisma();

  const albums = await prisma.photoAlbum.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      event: { select: { title: true } },
      photos: { orderBy: { createdAt: "asc" }, take: 1 },
      _count: { select: { photos: true } },
    },
  });

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/galleria" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Galleria foto
        </h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Le foto degli eventi passati, caricate dai soci.
        </p>
        {isAdmin && (
          <Link
            href="/admin/galleria/nuovo"
            className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
          >
            Nuovo album
          </Link>
        )}
      </header>

      {albums.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessun album pubblicato ancora.</p>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {albums.map((album) => {
            const cover = album.photos[0];
            const count = album._count.photos;
            return (
              <Link
                key={album.id}
                href={`/galleria/${album.id}`}
                className="flex flex-col gap-1 overflow-hidden rounded-cn border-2 border-ink bg-paper-card shadow-hard"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-paper-soft">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL pubblico R2, non gestito da next/image
                    <img
                      src={`${process.env.R2_PUBLIC_BASE_URL}/${cover.r2Key}`}
                      alt={album.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-ui text-xs text-ink-soft">Nessuna foto</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <h2 className="font-display text-xl font-black">{album.title}</h2>
                  <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                    {album.event ? `${album.event.title} · ` : ""}
                    {count} foto
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}
