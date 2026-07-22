import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { btnClassName } from "@/components/ui/Btn";
import { youtubeThumbnailUrl } from "@/lib/youtube";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function WebinarPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const prisma = getPrisma();

  const webinars = await prisma.webinar.findMany({ orderBy: { recordedAt: "desc" } });

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/webinar" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">Webinar</h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Le registrazioni delle assemblee e le lezioni sui temi civici.
        </p>
        {isAdmin && (
          <Link
            href="/admin/webinar/nuovo"
            className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
          >
            Nuovo webinar
          </Link>
        )}
      </header>

      {webinars.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessun webinar pubblicato ancora.</p>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {webinars.map((webinar) => (
            <Link
              key={webinar.id}
              href={`/webinar/${webinar.id}`}
              className="flex flex-col gap-1 overflow-hidden rounded-cn border-2 border-ink bg-paper-card shadow-hard"
            >
              <div className="aspect-video overflow-hidden bg-paper-soft">
                {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail YouTube, non gestita da next/image */}
                <img
                  src={youtubeThumbnailUrl(webinar.youtubeId)}
                  alt={webinar.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1 p-4">
                <h2 className="font-display text-lg font-black">{webinar.title}</h2>
                <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                  {dateFormatter.format(webinar.recordedAt)} · {webinar.duration}
                </p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
