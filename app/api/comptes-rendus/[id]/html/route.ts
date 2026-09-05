import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { obtenirCompteRendu, lireTravail } from "@/lib/comptes-rendus";
import { MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";

function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Retire les accents et caractères non-alphanum pour un nom de fichier sûr.
function slugifier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (session?.user?.role !== "PROF") {
    return NextResponse.json({ error: "Accès réservé aux professeurs." }, { status: 403 });
  }

  const compteRendu = await obtenirCompteRendu(id);
  if (!compteRendu) {
    return NextResponse.json({ error: "Compte-rendu introuvable." }, { status: 404 });
  }

  const travail = lireTravail(compteRendu.travail);
  const dateDepot = compteRendu.dateDepot.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sectionsExercices = travail.length
    ? travail
        .map(
          (exercice) => `
    <section class="exercice">
      <h2>${echapperHtml(exercice.exercice)}</h2>
      <pre><code>${echapperHtml(exercice.code)}</code></pre>
    </section>`
        )
        .join("\n")
    : `<p class="vide">Aucun travail joint à ce dépôt — l'élève a seulement signalé qu'il avait terminé.</p>`;

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Compte-rendu — ${echapperHtml(compteRendu.noms)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; color: #1a1a1a; line-height: 1.5; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .meta { color: #555; font-size: 0.9rem; margin: 0.15rem 0; }
  .exercice { margin-top: 1.75rem; border-top: 1px solid #ddd; padding-top: 1rem; }
  .exercice h2 { font-size: 1.05rem; margin-bottom: 0.5rem; }
  pre { background: #f4f4f5; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }
  code { font-family: ui-monospace, "SF Mono", Consolas, monospace; font-size: 0.9rem; }
  .vide { color: #555; font-style: italic; margin-top: 1.5rem; }
</style>
</head>
<body>
  <h1>${echapperHtml(compteRendu.noms)}</h1>
  <p class="meta">${compteRendu.classe ? `${echapperHtml(compteRendu.classe.nom)} · ` : ""}${echapperHtml(compteRendu.cours.titre)} · ${echapperHtml(MATIERE_LABELS[compteRendu.cours.matiere])} · ${echapperHtml(NIVEAU_LABELS[compteRendu.cours.niveau])}</p>
  <p class="meta">Déposé le ${dateDepot}</p>
  ${sectionsExercices}
</body>
</html>
`;

  const nomFichier = `compte-rendu-${slugifier(compteRendu.noms)}-${slugifier(compteRendu.cours.titre).slice(0, 40)}.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
    },
  });
}
