import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  estNomPageValide,
  lirePageInteractive,
  retirerCorrections,
  activerCorrections,
  injecterContexteEleve,
} from "@/lib/cours-interactif";
import { listerCamaradesClasse } from "@/lib/comptes-rendus";
import { formaterNomComplet } from "@/lib/utilisateurs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fichier: string }> }
) {
  const { fichier } = await params;

  if (!estNomPageValide(fichier)) {
    return new NextResponse("Page introuvable.", { status: 404 });
  }

  let html: string;
  try {
    html = await lirePageInteractive(fichier);
  } catch {
    return new NextResponse("Page introuvable.", { status: 404 });
  }

  const [session, cours] = await Promise.all([
    auth(),
    prisma.cours.findFirst({
      where: { pageInteractive: fichier },
      select: { correctionVisible: true },
    }),
  ]);

  // Le prof voit toujours les corrections ; l'élève seulement quand le
  // toggle du dashboard est activé pour ce cours.
  const corrigeAutorise =
    session?.user?.role === "PROF" || cours?.correctionVisible === true;

  let resultat = corrigeAutorise ? activerCorrections(html) : retirerCorrections(html);

  // Élève connecté et rattaché à une classe : le widget de dépôt peut
  // utiliser son identité et chercher ses camarades au lieu d'une saisie
  // libre — voir le contexte injecté et le widget dans contenu/cours/*.html.
  if (session?.user?.id && session.user.role === "ELEVE") {
    const [moi, camarades] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { nom: true, prenom: true, classeId: true },
      }),
      listerCamaradesClasse(session.user.id),
    ]);
    if (moi?.classeId) {
      resultat = injecterContexteEleve(resultat, {
        moi: { id: session.user.id, nom: formaterNomComplet(moi) },
        camarades: camarades.map((c) => ({ id: c.id, nom: formaterNomComplet(c) })),
      });
    }
  }

  return new NextResponse(resultat, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
