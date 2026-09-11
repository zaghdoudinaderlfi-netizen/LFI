import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obtenirCoursParId } from "@/lib/cours";
import { cheminCoursSimpleDepuisUrl } from "@/lib/cours-simple";
import { supabaseAdmin, BUCKET_COURS_SIMPLE } from "@/lib/supabase";
import { slugifier } from "@/lib/fichiers";
import {
  estNomPageValide,
  lirePageInteractive,
  finaliserHtmlCours,
  injecterStylesImpression,
} from "@/lib/cours-interactif";
import { listerCamaradesClasse } from "@/lib/comptes-rendus";
import { formaterNomComplet } from "@/lib/utilisateurs";

function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Télécharge la version HTML autoportante d'un cours pour une consultation
 * hors-ligne — même vérification d'accès que app/cours/[fichier]/route.ts
 * et app/api/cours/[id]/html/route.ts, mais avec un en-tête
 * Content-Disposition: attachment plutôt qu'un affichage inline.
 *
 * Trois cas selon le format du cours (voir CoursContenu) :
 * - `pageInteractive` : fichier HTML autoportant sur disque (contenu/cours),
 *   passé par la même chaîne de traitement que la version en ligne
 *   (corrections, widget de dépôt, progression Python restaurée).
 * - `typeSimple: HTML` : fichier HTML dans Supabase Storage, même chaîne de
 *   traitement (sans la progression, qui ne concerne que les pages
 *   d'exercices de contenu/cours).
 * - Sinon, le blob `contenu` de l'éditeur avancé : simplement emballé dans
 *   un document HTML minimal, sans injection (il n'y en a pas non plus à
 *   l'affichage en ligne pour ce format, voir CoursContenu).
 *
 * `?apercu=1` : mode utilisé par le bouton "Télécharger (PDF)" (impression
 * navigateur, voir telecharger-pdf-bouton.tsx) — affiche le document dans
 * l'onglet au lieu de le télécharger, avec un style d'impression forcé
 * (fond blanc/texte noir, voir injecterStylesImpression) puisque le thème
 * sombre des cours serait illisible une fois imprimé.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pourImpression = request.nextUrl.searchParams.get("apercu") === "1";

  const [session, cours] = await Promise.all([auth(), obtenirCoursParId(id)]);
  if (!cours) {
    return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
  }

  const estProf = session?.user?.role === "PROF";

  let utilisateur: {
    nom: string;
    prenom: string | null;
    classeId: string | null;
    classe: { niveau: string } | null;
  } | null = null;
  if (session?.user?.id && session.user.role === "ELEVE") {
    utilisateur = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nom: true, prenom: true, classeId: true, classe: { select: { niveau: true } } },
    });
  }

  const accesAutorise =
    estProf ||
    cours.estPublic === true ||
    (cours.publie === true && cours.visibleEleves === true && utilisateur?.classe?.niveau === cours.niveau);

  if (!accesAutorise) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/connexion", request.url));
    }
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const corrigeAutorise = estProf || cours.correctionVisible === true;
  const depotActive = cours.depotActive;
  const delaiDepasse = cours.dateLimiteDepot !== null && new Date() > cours.dateLimiteDepot;

  let contexteEleve = null;
  if (session?.user?.id && utilisateur?.classeId) {
    const camarades = await listerCamaradesClasse(session.user.id);
    contexteEleve = {
      moi: { id: session.user.id, nom: formaterNomComplet(utilisateur) },
      camarades: camarades.map((c) => ({ id: c.id, nom: formaterNomComplet(c) })),
    };
  }

  let html: string;
  let progression = null;

  if (cours.pageInteractive && estNomPageValide(cours.pageInteractive)) {
    try {
      html = await lirePageInteractive(cours.pageInteractive);
    } catch {
      return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
    }

    if (session?.user?.id && session.user.role === "ELEVE") {
      const progressions = await prisma.progressionExercice.findMany({
        where: { eleveId: session.user.id, coursId: cours.id },
        select: { exerciceId: true, codeSauvegarde: true },
      });
      progression = {
        coursId: cours.id,
        sauvegardes: Object.fromEntries(progressions.map((p) => [p.exerciceId, p.codeSauvegarde])),
      };
    }

    html = finaliserHtmlCours(html, {
      corrigeAutorise,
      contexteEleve,
      depot: depotActive ? { delaiDepasse, coursId: cours.id } : null,
      progression,
    });
  } else if (cours.typeSimple === "HTML" && cours.fichierUrl) {
    const chemin = cheminCoursSimpleDepuisUrl(cours.fichierUrl);
    if (!chemin) {
      return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin.storage.from(BUCKET_COURS_SIMPLE).download(chemin);
    if (error || !data) {
      return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
    }

    html = finaliserHtmlCours(await data.text(), {
      corrigeAutorise,
      contexteEleve,
      depot: depotActive ? { delaiDepasse, coursId: cours.id } : null,
      progression: null,
    });
  } else if (!cours.typeSimple && cours.typeContenu === "HTML" && cours.contenu.trim()) {
    html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${echapperHtml(cours.titre)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; color: #1a1a1a; line-height: 1.6; }
  img { max-width: 100%; }
  pre { background: #f4f4f5; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; overflow-x: auto; }
</style>
</head>
<body>
<h1>${echapperHtml(cours.titre)}</h1>
${cours.contenu}
</body>
</html>
`;
  } else {
    return NextResponse.json({ error: "Ce cours n'a pas de version HTML téléchargeable." }, { status: 404 });
  }

  if (pourImpression) {
    html = injecterStylesImpression(html);
  }

  const headers: Record<string, string> = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  };
  if (!pourImpression) {
    const nomFichier = `${slugifier(cours.titreInteractif ?? cours.titre)}.html`;
    headers["Content-Disposition"] = `attachment; filename="${nomFichier}"`;
  }

  return new NextResponse(html, { headers });
}
