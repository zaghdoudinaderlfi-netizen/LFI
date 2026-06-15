import type { Notification } from "@prisma/client";
import { CheckCheck } from "lucide-react";

export function NotificationsListe({
  notifications,
  ouvrirAction,
  toutMarquerLuAction,
}: {
  notifications: Notification[];
  ouvrirAction: (formData: FormData) => Promise<void>;
  toutMarquerLuAction: () => Promise<void>;
}) {
  const nonLues = notifications.filter((notif) => !notif.lu).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <h1 className="page-title">Notifications</h1>
        {nonLues > 0 && (
          <form action={toutMarquerLuAction}>
            <button type="submit" className="btn-ghost text-sm">
              <CheckCheck className="h-4 w-4" />
              Tout marquer comme lu
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card animate-fade-in-up p-6 text-center">
          <p className="text-ink-secondary">Aucune notification pour le moment.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 animate-fade-in-up [animation-delay:60ms]">
          {notifications.map((notif) => (
            <li key={notif.id}>
              <form action={ouvrirAction}>
                <input type="hidden" name="id" value={notif.id} />
                <input type="hidden" name="lien" value={notif.lien ?? ""} />
                <button
                  type="submit"
                  className={`card-interactive flex w-full flex-col gap-1 p-4 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                    notif.lu ? "" : "border-neon-cyan/40 bg-space-surface2/80"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {!notif.lu && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-neon-pink shadow-[0_0_8px_rgba(244,114,182,0.7)]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-sm text-ink-primary">{notif.message}</span>
                  </span>
                  <span className="text-xs text-ink-muted sm:shrink-0">
                    {notif.createdAt.toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
