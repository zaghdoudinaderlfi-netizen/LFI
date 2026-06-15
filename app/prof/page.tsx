import Link from "next/link";
import { ClipboardCheck, ListPlus, PlusCircle } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compterSoumissionsACorriger, listerSoumissionsRecentes } from "@/lib/soumissions";
import { listerClasses, NIVEAU_LABELS } from "@/lib/classes";
import { formaterNomComplet } from "@/lib/utilisateurs";
import { AvatarDisplay } from "@/components/avatar/avatar-display";

export default async function ProfPage() {
  const session = await auth();

  const [user, aCorrigerCount, recentes, classes] = await Promise.all([
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, nom: true, prenom: true, avatarStyle: true, avatarOptions: true },
        })
      : Promise.resolve(null),
    compterSoumissionsACorriger(),
    listerSoumissionsRecentes(5),
    listerClasses(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-4 animate-fade-in-up">
        {user && <AvatarDisplay user={user} neutre taille="lg" />}
        <div>
          <p className="eyebrow">Bonjour</p>
          <h1 className="page-title">
            {user?.prenom?.trim() || user?.nom?.split(" ")[0] || ""}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-in-up [animation-delay:60ms]">
        <Link href="/prof/cours/nouveau" className="card-interactive flex flex-col gap-2 p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-neon-blue to-neon-violet shadow-glow-soft">
            <PlusCircle className="h-5 w-5 text-space-bg" />
          </span>
          <p className="font-semibold text-ink-primary">Créer un cours</p>
          <p className="text-sm text-ink-secondary">
            Ajoute un nouveau cours de Technologie ou SNT.
          </p>
        </Link>

        <Link href="/prof/cours" className="card-interactive flex flex-col gap-2 p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-neon-cyan to-neon-blue shadow-glow-soft">
            <ListPlus className="h-5 w-5 text-space-bg" />
          </span>
          <p className="font-semibold text-ink-primary">Créer un devoir</p>
          <p className="text-sm text-ink-secondary">
            Ajoute un devoir depuis la page d&apos;un de tes cours.
          </p>
        </Link>
      </div>

      <Link
        href="/prof/devoirs"
        className="card-interactive flex items-center justify-between p-6 animate-fade-in-up [animation-delay:120ms]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-space-surface2 text-neon-pink">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="section-title">Copies à corriger</h2>
            <p className="text-sm text-ink-secondary">
              Travaux remis par les élèves, en attente de correction.
            </p>
          </div>
        </div>
        <p className="font-heading text-3xl font-bold text-ink-primary">{aCorrigerCount}</p>
      </Link>

      <section className="card animate-fade-in-up p-6 [animation-delay:180ms]">
        <h2 className="section-title mb-4">Derniers travaux remis</h2>

        {recentes.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun travail remis pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recentes.map((soumission) => (
              <li key={soumission.id}>
                <Link
                  href="/prof/devoirs"
                  className="card-interactive flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-ink-primary">{soumission.exercice.titre}</p>
                    <p className="text-sm text-ink-secondary">
                      {soumission.exercice.cours.titre} · {formaterNomComplet(soumission.eleve)}
                    </p>
                  </div>
                  <div className="text-sm sm:text-right">
                    <p className="text-ink-muted">{soumission.createdAt.toLocaleDateString("fr-FR")}</p>
                    <p
                      className={
                        soumission.corrigeManuellement
                          ? "font-medium text-emerald-400"
                          : "font-medium text-amber-400"
                      }
                    >
                      {soumission.corrigeManuellement ? "Corrigé" : "À corriger"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card animate-fade-in-up p-6 [animation-delay:240ms]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Mes classes</h2>
          <Link href="/prof/classes" className="link-muted text-sm">
            Gérer
          </Link>
        </div>

        {classes.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucune classe pour le moment.{" "}
            <Link href="/prof/classes" className="link-muted underline">
              Crée ta première classe
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {classes.map((classe) => (
              <li
                key={classe.id}
                className="flex flex-col gap-2 rounded-xl border border-space-border bg-space-surface2/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink-primary">{classe.nom}</p>
                  <p className="text-sm text-ink-secondary">
                    {NIVEAU_LABELS[classe.niveau]} · {classe.anneeScolaire} ·{" "}
                    {classe.nombreEleves} {classe.nombreEleves > 1 ? "élèves" : "élève"}
                  </p>
                </div>
                <span className="rounded-lg border border-space-border bg-space-surface px-3 py-1 font-mono text-sm font-bold text-neon-cyan">
                  {classe.codeInscription}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
