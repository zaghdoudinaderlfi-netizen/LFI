import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compterNotificationsNonLues, compterNotificationsNonLuesParType } from "@/lib/notifications";
import { obtenirProgressionEleve } from "@/lib/suivi-oral";
import { mainEstLevee } from "@/lib/mains-levees";
import { AppShell } from "@/components/nav/app-shell";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PresenceHeartbeat } from "@/components/eleve/presence-heartbeat";
import { LeverMainBouton } from "@/components/eleve/lever-main-bouton";

export default async function EleveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const [user, notificationsNonLues, notificationsParType, progression, mainLevee] = session?.user?.id
    ? await Promise.all([
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            nom: true,
            prenom: true,
            avatarStyle: true,
            avatarOptions: true,
            doitChangerMdp: true,
          },
        }),
        compterNotificationsNonLues(session.user.id),
        compterNotificationsNonLuesParType(session.user.id),
        obtenirProgressionEleve(session.user.id),
        mainEstLevee(session.user.id),
      ])
    : [null, 0, undefined, null, false];

  return (
    <>
      <AppShell
        role="ELEVE"
        user={user ?? { id: session?.user?.id ?? "", nom: session?.user?.name ?? "" }}
        notificationsNonLues={notificationsNonLues}
        notificationsParType={notificationsParType}
        shieldPalier={progression?.palier}
      >
        {children}
      </AppShell>
      <PWAInstallPrompt />
      <PresenceHeartbeat />
      {session?.user?.id && <LeverMainBouton initial={mainLevee} />}
    </>
  );
}
