import { Suspense } from "react";
import type { Matiere } from "@prisma/client";
import { auth } from "@/auth";
import { listerNotifications } from "@/lib/notifications";
import { estMatiereValide } from "@/lib/classes-constants";
import { MatiereTabs } from "@/components/matiere-tabs";
import { NotificationsListe } from "@/components/nav/notifications-liste";
import { ouvrirNotificationAction, toutMarquerLuAction } from "./actions";

export default async function EleveNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ matiere?: string }>;
}) {
  const { matiere: matiereParam } = await searchParams;
  const matiereActive: Matiere | null = estMatiereValide(matiereParam) ? matiereParam : null;

  const session = await auth();
  const notifications = session?.user?.id
    ? await listerNotifications(session.user.id, matiereActive ?? undefined)
    : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Suspense fallback={null}>
        <MatiereTabs
          matiereActive={matiereActive}
          basePath="/eleve/notifications"
          storageKey="eleve-notifications-matiere-filtre"
          avecToutes
        />
      </Suspense>
      <NotificationsListe
        notifications={notifications}
        ouvrirAction={ouvrirNotificationAction}
        toutMarquerLuAction={toutMarquerLuAction}
        matiereActive={matiereActive}
      />
    </div>
  );
}
