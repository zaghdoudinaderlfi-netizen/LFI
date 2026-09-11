import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obtenirCoursParId } from "@/lib/cours";
import { cheminCoursSimpleDepuisUrl } from "@/lib/cours-simple";
import { supabaseAdmin, BUCKET_COURS_SIMPLE } from "@/lib/supabase";
import {
  activerCorrections,
  retirerCorrections,
  injecterContexteEleve,
  injecterWidgetDepot,
  injecterMessageDelaiDepasse,
  injecterBlocageCollage,
} from "@/lib/cours-interactif";
import { listerCamaradesClasse } from "@/lib/comptes-rendus";
import { formaterNomComplet } from "@/lib/utilisateurs";

/**
 * Sert le fichier HTML d'un cours "mode simplifié" en le retéléchargeant
 * depuis Supabase Storage et en le renvoyant avec un Content-Type explicite.
 * Nécessaire car l'URL publique Supabase force `Content-Type: text/plain`
 * et une CSP `sandbox` sur les objets HTML (protection anti-XSS côté
 * Storage), ce qui fait que le navigateur affiche le code source au lieu
 * d'afficher la page dans l'iframe élève.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cours = await obtenirCoursParId(id);
  if (!cours || cours.typeSimple !== "HTML" || !cours.fichierUrl) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const session = cours.estPublic ? null : await auth();

  if (!cours.estPublic && !session?.user) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  let utilisateur: {
    nom: string;
    prenom: string | null;
    classeId: string | null;
    classe: { niveau: string } | null;
  } | null = null;

  if (session && session.user.role !== "PROF") {
    utilisateur = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nom: true, prenom: true, classeId: true, classe: { select: { niveau: true } } },
    });

    const accesAutorise = cours.publie && utilisateur?.classe?.niveau === cours.niveau;

    if (!accesAutorise) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
  }

  const chemin = cheminCoursSimpleDepuisUrl(cours.fichierUrl);
  if (!chemin) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin.storage.from(BUCKET_COURS_SIMPLE).download(chemin);
  if (error || !data) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const html = await data.text();

  // Le prof voit toujours les corrections ; l'élève seulement quand le
  // toggle du dashboard est activé pour ce cours — décidé côté serveur,
  // jamais depuis le paramètre `?corrige=1` de l'URL (voir CoursContenu),
  // qui n'est qu'un raccourci d'affichage, pas une autorisation.
  const estProf = session?.user?.role === "PROF";
  const corrigeAutorise = estProf || cours.correctionVisible === true;
  let resultat = corrigeAutorise ? activerCorrections(html) : retirerCorrections(html);

  // Élève connecté et rattaché à une classe : le widget de dépôt peut
  // utiliser son identité et chercher ses camarades au lieu d'une saisie
  // libre — même logique que app/cours/[fichier]/route.ts.
  if (session?.user?.id && utilisateur?.classeId) {
    const camarades = await listerCamaradesClasse(session.user.id);
    resultat = injecterContexteEleve(resultat, {
      moi: { id: session.user.id, nom: formaterNomComplet(utilisateur) },
      camarades: camarades.map((c) => ({ id: c.id, nom: formaterNomComplet(c) })),
    });
  }

  if (cours.depotActive) {
    const delaiDepasse = cours.dateLimiteDepot !== null && new Date() > cours.dateLimiteDepot;
    resultat = delaiDepasse
      ? injecterMessageDelaiDepasse(resultat)
      : injecterWidgetDepot(resultat, cours.id);
  }

  // Frein pédagogique contre le copier-coller dans les zones de code —
  // s'applique à toutes les pages, sans condition (pas un toggle prof).
  resultat = injecterBlocageCollage(resultat);

  return new NextResponse(resultat, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
