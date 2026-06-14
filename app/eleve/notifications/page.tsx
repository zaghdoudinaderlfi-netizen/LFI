import { auth } from "@/auth";
import { listerNotifications } from "@/lib/notifications";
import { NotificationsListe } from "@/components/nav/notifications-liste";
import { ouvrirNotificationAction, toutMarquerLuAction } from "./actions";

export default async function EleveNotificationsPage() {
  const session = await auth();
  const notifications = session?.user?.id
    ? await listerNotifications(session.user.id)
    : [];

  return (
    <NotificationsListe
      notifications={notifications}
      ouvrirAction={ouvrirNotificationAction}
      toutMarquerLuAction={toutMarquerLuAction}
    />
  );
}
