import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { creerUrlTelechargement, obtenirDocument } from "@/lib/casier";
import { MATIERE_PAR_NIVEAU } from "@/lib/classes-constants";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const doc = await obtenirDocument(id);
  if (!doc) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  if (session.user.role === "PROF") {
    // Le prof voit tout — pas de restriction supplémentaire.
  } else {
    // Élève : ses propres fichiers, ou un document partagé pour sa matière.
    const utilisateur = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { classe: { select: { niveau: true } } },
    });
    const matiereEleve = utilisateur?.classe ? MATIERE_PAR_NIVEAU[utilisateur.classe.niveau] : null;

    const accesAutorise =
      doc.eleveId === session.user.id || (doc.eleveId === null && doc.matiere === matiereEleve);

    if (!accesAutorise) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
  }

  const inline = request.nextUrl.searchParams.get("inline") === "1";
  const url = await creerUrlTelechargement(doc, { inline });
  return NextResponse.redirect(url);
}
