import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compterNotificationsNonLues, compterNotificationsNonLuesParType } from "@/lib/notifications";
import { AppShell } from "@/components/nav/app-shell";
import { BullePresence } from "@/components/prof/bulle-presence";
import { MainsLeveesBulle } from "@/components/prof/mains-levees-bulle";
import { DemoBanner } from "@/components/demo/demo-banner";

export default async function ProfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isDemo = session?.user?.isDemo ?? false;

  const [user, notificationsNonLues, notificationsParType] = session?.user?.id
    ? await Promise.all([
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, nom: true, prenom: true, avatarStyle: true, avatarOptions: true },
        }),
        compterNotificationsNonLues(session.user.id),
        compterNotificationsNonLuesParType(session.user.id),
      ])
    : [null, 0, undefined];

  return (
    <>
      {isDemo && <DemoBanner />}
      <AppShell
        role="PROF"
        user={user ?? { id: session?.user?.id ?? "", nom: session?.user?.name ?? "" }}
        notificationsNonLues={notificationsNonLues}
        notificationsParType={notificationsParType}
      >
        {children}
      </AppShell>
      {/* Ces bulles interrogent la présence/main levée en direct sur TOUTES
          les vraies classes, sans filtre "démo" possible côté client — on ne
          les monte simplement pas pour un compte démo (voir DemoBanner). */}
      {!isDemo && <BullePresence />}
      {!isDemo && <MainsLeveesBulle />}
    </>
  );
}
