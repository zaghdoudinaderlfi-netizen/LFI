import { auth } from "@/auth";
import { compterNotificationsNonLues } from "@/lib/notifications";
import { AppShell } from "@/components/nav/app-shell";

export default async function EleveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const notificationsNonLues = session?.user?.id
    ? await compterNotificationsNonLues(session.user.id)
    : 0;

  return (
    <AppShell
      role="ELEVE"
      userName={session?.user?.name ?? ""}
      notificationsNonLues={notificationsNonLues}
    >
      {children}
    </AppShell>
  );
}
