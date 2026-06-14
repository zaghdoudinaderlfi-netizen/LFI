import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NIVEAU_LABELS } from "@/lib/classes";
import { ProfilForm } from "./profil-form";

export default async function EleveProfilPage() {
  const session = await auth();

  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { classe: true },
      })
    : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-800">Profil</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="flex flex-col gap-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email
            </dt>
            <dd className="text-sm text-slate-800">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Rôle
            </dt>
            <dd className="text-sm text-slate-800">Élève</dd>
          </div>
          {user?.classe && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Classe
              </dt>
              <dd className="text-sm text-slate-800">
                {user.classe.nom} · {NIVEAU_LABELS[user.classe.niveau]} ·{" "}
                {user.classe.anneeScolaire}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Prénom et nom</h2>
        <p className="mb-4 text-sm text-slate-500">
          Renseigne ton prénom et ton nom pour que ton professeur puisse t&apos;identifier facilement.
        </p>
        <ProfilForm nom={user?.nom ?? ""} prenom={user?.prenom ?? ""} />
      </div>
    </div>
  );
}
