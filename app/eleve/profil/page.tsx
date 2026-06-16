import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NIVEAU_LABELS } from "@/lib/classes";
import { configAvatarUtilisateur } from "@/lib/avatar";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { AvatarBuilder } from "@/components/avatar/avatar-builder";
import { ChangerMdpForm } from "@/components/profil/changer-mdp-form";
import { ProfilForm } from "./profil-form";
import { EmailForm } from "./email-form";
import { changerMdpAction, modifierEmailAction } from "./actions";

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

      {/* Carte identité */}
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

      {/* Avatar */}
      <section className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        <h2 className="section-title mb-1">Avatar</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          Personnalise ton avatar : il s&apos;affiche dans le menu et partout sur la plateforme.
        </p>
        {user && (
          <AvatarBuilder seed={user.id} configInitiale={configAvatarUtilisateur(user)} />
        )}
      </section>

      {/* Prénom et nom */}
      <section className="card animate-fade-in-up p-6 [animation-delay:120ms]">
        <h2 className="section-title mb-1">Prénom et nom</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          Renseigne ton prénom et ton nom pour que ton professeur puisse t&apos;identifier facilement.
        </p>
        <ProfilForm nom={user?.nom ?? ""} prenom={user?.prenom ?? ""} />
      </section>

      {/* Adresse email */}
      <section className="card animate-fade-in-up p-6 [animation-delay:180ms]">
        <h2 className="section-title mb-1">Adresse email</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          Ton adresse email sert à te connecter et à recevoir un lien si tu oublies ton mot de passe.
        </p>
        <EmailForm emailActuel={user?.email ?? ""} action={modifierEmailAction} />
      </section>

      {/* Changer le mot de passe */}
      <section id="securite" className="card animate-fade-in-up p-6 [animation-delay:240ms]">
        <h2 className="section-title mb-1">Mot de passe</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          Confirme ton mot de passe actuel avant d&apos;en définir un nouveau.
        </p>
        <ChangerMdpForm action={changerMdpAction} />
      </section>
    </div>
  );
}
