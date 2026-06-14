import type { Notification } from "@prisma/client";

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
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
        {nonLues > 0 && (
          <form action={toutMarquerLuAction}>
            <button type="submit" className="text-sm text-slate-500 hover:underline">
              Tout marquer comme lu
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-slate-500">Aucune notification pour le moment.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notif) => (
            <li key={notif.id}>
              <form action={ouvrirAction}>
                <input type="hidden" name="id" value={notif.id} />
                <input type="hidden" name="lien" value={notif.lien ?? ""} />
                <button
                  type="submit"
                  className={`flex w-full flex-col gap-1 rounded-lg border p-4 text-left shadow-sm transition-colors hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                    notif.lu ? "border-slate-200 bg-white" : "border-slate-300 bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {!notif.lu && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />
                    )}
                    <span className="text-sm text-slate-800">{notif.message}</span>
                  </span>
                  <span className="text-xs text-slate-400 sm:shrink-0">
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
