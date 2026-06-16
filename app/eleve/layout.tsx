import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compterNotificationsNonLues } from "@/lib/notifications";
import { AppShell } from "@/components/nav/app-shell";

export default async function EleveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const [user, notificationsNonLues] = session?.user?.id
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
      ])
    : [null, 0];

  return (
    <AppShell
      role="ELEVE"
      user={user ?? { id: session?.user?.id ?? "", nom: session?.user?.name ?? "" }}
      notificationsNonLues={notificationsNonLues}
    >
      <>
        {user?.doitChangerMdp && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <p className="text-sm font-medium text-amber-400">
              Ton professeur a réinitialisé ton mot de passe.{" "}
              <Link href="/eleve/profil#securite" className="underline hover:text-amber-300">
                Change-le maintenant
              </Link>{" "}
              pour sécuriser ton compte.
            </p>
          </div>
        )}
        {children}
      </>
    </AppShell>
  );
}
