import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NIVEAU_LABELS } from "@/lib/classes";
import { configAvatarUtilisateur } from "@/lib/avatar";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { AvatarBuilder } from "@/components/avatar/avatar-builder";
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
      <h1 className="page-title animate-fade-in-up">Profil</h1>

      <section className="card animate-fade-in-up flex flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          {user && <AvatarDisplay user={user} taille="xl" />}
          <div>
            <p className="text-lg font-semibold text-ink-primary">
              {[user?.prenom, user?.nom].filter(Boolean).join(" ")}
            </p>
            <p className="text-sm text-ink-secondary">{user?.email}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 border-t border-space-border pt-4 sm:grid-cols-3">
          <div>
            <dt className="eyebrow mb-1">Rôle</dt>
            <dd className="text-sm text-ink-primary">Élève</dd>
          </div>
          {user?.classe && (
            <div className="sm:col-span-2">
              <dt className="eyebrow mb-1">Classe</dt>
              <dd className="text-sm text-ink-primary">
                {user.classe.nom} · {NIVEAU_LABELS[user.classe.niveau]} · {user.classe.anneeScolaire}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        <h2 className="section-title mb-1">Personnalise ton avatar</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          Choisis un style, une couleur de fond et les détails de ton avatar : il s&apos;affichera dans le menu et partout ailleurs sur la plateforme.
        </p>
        {user && <AvatarBuilder seed={user.id} configInitiale={configAvatarUtilisateur(user)} />}
      </section>

      <section className="card animate-fade-in-up p-6 [animation-delay:120ms]">
        <h2 className="section-title mb-1">Prénom et nom</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          Renseigne ton prénom et ton nom pour que ton professeur puisse t&apos;identifier facilement.
        </p>
        <ProfilForm nom={user?.nom ?? ""} prenom={user?.prenom ?? ""} />
      </section>
    </div>
  );
}
