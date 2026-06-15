import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AvatarDisplay } from "@/components/avatar/avatar-display";

export default async function ProfProfilPage() {
  const session = await auth();

  const user = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="page-title animate-fade-in-up">Profil</h1>

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
    </div>
  );
}
