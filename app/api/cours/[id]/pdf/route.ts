import { NextRequest, NextResponse } from "next/server";
import { TypeContenuCours } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obtenirCoursParId } from "@/lib/cours";
import { creerUrlTelechargement } from "@/lib/pieces-jointes";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cours = await obtenirCoursParId(id);
  if (!cours || cours.typeContenu !== TypeContenuCours.PDF || !cours.pdfChemin || !cours.pdfNom) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const session = cours.estPublic ? null : await auth();

  if (!cours.estPublic && !session?.user) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  if (session && session.user.role !== "PROF") {
    const utilisateur = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { classe: true },
    });

    const accesAutorise = cours.publie && utilisateur?.classe?.niveau === cours.niveau;

    if (!accesAutorise) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
  }

  const inline = request.nextUrl.searchParams.get("inline") === "1";
  const url = await creerUrlTelechargement({ chemin: cours.pdfChemin, nom: cours.pdfNom }, { inline });
  return NextResponse.redirect(url);
}
