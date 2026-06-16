import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { ChangerMdpForm } from "@/components/profil/changer-mdp-form";
import { ProfilProfForm } from "./profil-form";
import { changerMdpProfAction } from "./actions";

export default async function ProfProfilPage() {
  const session = await auth();

  const user = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="page-title animate-fade-in-up">Profil</h1>

      {/* Carte identité */}
      <section className="card animate-fade-in-up flex flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          {user && <AvatarDisplay user={user} neutre taille="xl" />}
          <div>
            <p className="text-lg font-semibold text-ink-primary">
              {[user?.prenom, user?.nom].filter(Boolean).join(" ")}
            </p>
            <p className="text-sm text-ink-secondary">{user?.email}</p>
          </div>
        </div>

        <dl className="border-t border-space-border pt-4">
          <dt className="eyebrow mb-1">Rôle</dt>
          <dd className="text-sm text-ink-primary">Professeur</dd>
        </dl>
      </section>

      {/* Prénom et nom */}
      <section className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        <h2 className="section-title mb-1">Prénom et nom</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          Ces informations apparaissent dans les notifications envoyées aux élèves.
        </p>
        <ProfilProfForm nom={user?.nom ?? ""} prenom={user?.prenom ?? ""} />
      </section>

      {/* Changer le mot de passe */}
      <section className="card animate-fade-in-up p-6 [animation-delay:120ms]">
        <h2 className="section-title mb-1">Mot de passe</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          Confirme ton mot de passe actuel avant d&apos;en définir un nouveau.
        </p>
        <ChangerMdpForm action={changerMdpProfAction} />
      </section>
    </div>
  );
}
