import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { youtubeEmbedUrl } from "@/lib/youtube";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function WebinarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prisma = getPrisma();
  const webinar = await prisma.webinar.findUnique({ where: { id } });
  if (!webinar) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <SiteHeader activeHref="/webinar" />

      <Link href="/webinar" className="font-ui text-sm text-ink-soft underline">
        &larr; Torna ai webinar
      </Link>

      <div className="aspect-video overflow-hidden rounded-cn border-2 border-ink shadow-hard">
        <iframe
          src={youtubeEmbedUrl(webinar.youtubeId)}
          title={webinar.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <h1 className="font-display text-3xl font-black">{webinar.title}</h1>
      <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
        {dateFormatter.format(webinar.recordedAt)} · {webinar.duration}
      </p>
      <p className="font-ui text-sm text-ink-soft">{webinar.description}</p>
    </main>
  );
}
