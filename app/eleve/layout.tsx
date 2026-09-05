import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compterNotificationsNonLues, compterNotificationsNonLuesParType } from "@/lib/notifications";
import { obtenirProgressionEleve } from "@/lib/suivi-oral";
import { AppShell } from "@/components/nav/app-shell";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export default async function EleveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const [user, notificationsNonLues, notificationsParType, progression] = session?.user?.id
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
      ])
    : [null, 0, undefined, null];

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
    </>
  );
}
