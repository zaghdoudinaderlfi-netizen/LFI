import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  estNomPageValide,
  lirePageInteractive,
  retirerCorrections,
  activerCorrections,
  injecterContexteEleve,
  injecterWidgetDepot,
  injecterMessageDelaiDepasse,
} from "@/lib/cours-interactif";
import { listerCamaradesClasse } from "@/lib/comptes-rendus";
import { formaterNomComplet } from "@/lib/utilisateurs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fichier: string }> }
) {
  const { fichier } = await params;

  if (!estNomPageValide(fichier)) {
    return new NextResponse("Page introuvable.", { status: 404 });
  }

  const [session, cours] = await Promise.all([
    auth(),
    prisma.cours.findFirst({
      where: { pageInteractive: fichier },
      select: {
        id: true,
        correctionVisible: true,
        depotActive: true,
        dateLimiteDepot: true,
        publie: true,
        visibleEleves: true,
        estPublic: true,
        niveau: true,
      },
    }),
  ]);

  // Le fichier doit correspondre à un cours en base : un fichier orphelin
  // (jamais rattaché, ou dérattaché) n'est plus servable, même par son nom.
  if (!cours) {
    return new NextResponse("Page introuvable.", { status: 404 });
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

  // Autorisation d'accès au cours lui-même — distincte de l'autorisation des
  // corrections gérée plus bas. Un cours public (`estPublic`) est ouvert à
  // tous ; sinon il faut être prof, ou élève dont la classe correspond au
  // niveau d'un cours publié et visible côté élève.
  const accesAutorise =
    estProf ||
    cours.estPublic === true ||
    (cours.publie === true &&
      cours.visibleEleves === true &&
      utilisateur?.classe?.niveau === cours.niveau);

  if (!accesAutorise) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/connexion", request.url));
    }
    return new NextResponse("Accès refusé.", { status: 403 });
  }

  let html: string;
  try {
    html = await lirePageInteractive(fichier);
  } catch {
    return new NextResponse("Page introuvable.", { status: 404 });
  }

  // Le prof voit toujours les corrections ; l'élève seulement quand le
  // toggle du dashboard est activé pour ce cours.
  const corrigeAutorise = estProf || cours.correctionVisible === true;

  let resultat = corrigeAutorise ? activerCorrections(html) : retirerCorrections(html);

  // Élève connecté et rattaché à une classe : le widget de dépôt peut
  // utiliser son identité et chercher ses camarades au lieu d'une saisie
  // libre — voir le contexte injecté et le widget dans contenu/cours/*.html.
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

  return new NextResponse(resultat, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
