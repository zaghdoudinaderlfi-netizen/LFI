import Link from "next/link";
import { Suspense } from "react";
import { ClipboardCheck, ListPlus, PlusCircle } from "lucide-react";
import { Matiere } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compterSoumissionsACorriger, listerSoumissionsRecentes } from "@/lib/soumissions";
import { listerClasses, NIVEAU_LABELS } from "@/lib/classes";
import { NIVEAU_PAR_MATIERE, estMatiereValide } from "@/lib/classes-constants";
import { MATIERE_LABELS } from "@/lib/cours";
import { formaterNomComplet } from "@/lib/utilisateurs";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { MatiereTabs } from "@/components/matiere-tabs";

export default async function ProfPage({
  searchParams,
}: {
  searchParams: Promise<{ matiere?: string }>;
}) {
  const { matiere: matiereParam } = await searchParams;
  const matiere: Matiere | null = estMatiereValide(matiereParam) ? matiereParam : null;

  const session = await auth();

  const niveauFiltré = matiere ? NIVEAU_PAR_MATIERE[matiere] : undefined;

  const [user, aCorrigerCount, recentes, classes] = await Promise.all([
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, nom: true, prenom: true, avatarStyle: true, avatarOptions: true },
        })
      : Promise.resolve(null),
    compterSoumissionsACorriger(matiere ?? undefined),
    listerSoumissionsRecentes(5, matiere ?? undefined),
    listerClasses(),
  ]);

  const classesFiltrees = niveauFiltré
    ? classes.filter((c) => c.niveau === niveauFiltré)
    : classes;

  const labelMatiere = matiere ? MATIERE_LABELS[matiere] : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* En-tête prof */}
      <div className="flex items-center gap-4 animate-fade-in-up">
        {user && <AvatarDisplay user={user} neutre taille="lg" />}
        <div>
          <p className="font-mono text-xs font-bold tracking-widest" style={{ color: "rgb(var(--techno-txt))" }}>
            // BONJOUR
          </p>
          <h1 className="page-title">
            {user?.prenom?.trim() || user?.nom?.split(" ")[0] || ""}
          </h1>
        </div>
      </div>

      {/* Onglets matière */}
      <Suspense fallback={null}>
        <MatiereTabs matiereActive={matiere} basePath="/prof" storageKey="prof-matiere-filtre" />
      </Suspense>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-in-up [animation-delay:60ms]">
        <Link href="/prof/cours/nouveau" className="tile-arcade">
          <span className="icon-badge-nsi">
            <PlusCircle className="h-5 w-5" />
          </span>
          <p className="font-semibold text-ink-primary">Créer un cours</p>
          <p className="text-sm text-ink-secondary">
            {labelMatiere
              ? `Ajoute un nouveau cours de ${labelMatiere}.`
              : "Ajoute un cours de Technologie, SNT ou NSI."}
          </p>
        </Link>

        <Link href="/prof/cours" className="tile-arcade">
          <span className="icon-badge-snt">
            <ListPlus className="h-5 w-5" />
          </span>
          <p className="font-semibold text-ink-primary">Créer un devoir</p>
          <p className="text-sm text-ink-secondary">
            Ajoute un devoir depuis la page d&apos;un de tes cours.
          </p>
        </Link>
      </div>

      {/* Copies à corriger */}
      <Link
        href={matiere ? `/prof/devoirs?matiere=${matiere}` : "/prof/devoirs"}
        className="card-hard card-hard-nsi flex items-center justify-between p-6 animate-fade-in-up [animation-delay:120ms]"
      >
        <div className="flex items-center gap-3">
          <span className="icon-badge-nsi">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="section-title">
              Copies à corriger{labelMatiere ? ` — ${labelMatiere}` : ""}
            </h2>
            <p className="text-sm text-ink-secondary">
              Travaux remis par les élèves, en attente de correction.
            </p>
          </div>
        </div>
        <p className="font-heading text-3xl font-bold" style={{ color: "rgb(var(--arcade-nsi))" }}>
          {aCorrigerCount}
        </p>
      </Link>

      {/* Derniers travaux remis */}
      <section className="card-hard animate-fade-in-up p-6 [animation-delay:180ms]">
        <h2 className="section-title mb-4">
          Derniers travaux remis{labelMatiere ? ` — ${labelMatiere}` : ""}
        </h2>

        {recentes.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun travail remis pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recentes.map((soumission) => (
              <li key={soumission.id}>
                <Link
                  href="/prof/devoirs"
                  className="item-arcade flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
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
                      className="font-medium"
                      style={{
                        color: soumission.corrigeManuellement
                          ? "rgb(52 211 153)"
                          : "rgb(var(--arcade-techno))",
                      }}
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

      {/* Mes classes */}
      <section className="card-hard card-hard-techno animate-fade-in-up p-6 [animation-delay:240ms]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            <span className="font-mono text-sm" style={{ color: "rgb(var(--arcade-techno))" }}>⚙</span>
            Mes classes{labelMatiere ? ` — ${labelMatiere}` : ""}
          </h2>
          <Link href="/prof/classes" className="text-sm font-medium hover:underline" style={{ color: "rgb(var(--techno-txt))" }}>
            Gérer
          </Link>
        </div>

        {classesFiltrees.length === 0 ? (
          <p className="text-sm text-ink-muted">
            {labelMatiere
              ? `Aucune classe de ${labelMatiere} (${niveauFiltré ? NIVEAU_LABELS[niveauFiltré] : ""}) pour le moment.`
              : "Aucune classe pour le moment."}{" "}
            <Link href="/prof/classes" className="underline" style={{ color: "rgb(var(--techno-txt))" }}>
              {classesFiltrees.length === 0 && classes.length > 0 ? "Créer une classe" : "Crée ta première classe"}
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {classesFiltrees.map((classe) => (
              <li
                key={classe.id}
                className="item-arcade flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink-primary">{classe.nom}</p>
                  <p className="text-sm text-ink-secondary">
                    {NIVEAU_LABELS[classe.niveau]} · {classe.anneeScolaire} ·{" "}
                    {classe.nombreEleves} {classe.nombreEleves > 1 ? "élèves" : "élève"}
                  </p>
                </div>
                <span
                  className="rounded-lg border px-3 py-1 font-mono text-sm font-bold"
                  style={{
                    color: "rgb(var(--snt-txt))",
                    borderColor: "rgba(var(--arcade-snt), 0.35)",
                    background: "rgba(var(--arcade-snt), 0.08)",
                  }}
                >
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
