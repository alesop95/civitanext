import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { markAllAsRead } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function NotifichePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const prisma = getPrisma();
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-16">
      <SiteHeader activeHref="/notifiche" />

      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-black">Notifiche</h1>
        {unreadCount > 0 && (
          <form action={markAllAsRead}>
            <Btn type="submit" kind="secondary" small>
              Segna tutte come lette
            </Btn>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessuna notifica per ora.</p>
      ) : (
        <section className="flex flex-col gap-3">
          {notifications.map((notification) => {
            const content = (
              <div
                className={[
                  "flex flex-col gap-1 rounded-cn border-2 border-ink p-4 shadow-hard",
                  notification.read ? "bg-paper-card" : "bg-accent text-white",
                ].join(" ")}
              >
                <p className="font-ui text-sm">{notification.message}</p>
                <p
                  className={[
                    "font-ui text-xs font-bold uppercase tracking-wide",
                    notification.read ? "text-ink-soft" : "text-white/80",
                  ].join(" ")}
                >
                  {dateFormatter.format(notification.createdAt)}
                </p>
              </div>
            );

            return notification.link ? (
              <Link key={notification.id} href={notification.link}>
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </section>
      )}
    </main>
  );
}
