import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obtenirBlocAvecCours } from "@/lib/blocs";
import { creerUrlTelechargement } from "@/lib/pieces-jointes";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  const bloc = await obtenirBlocAvecCours(id);
  if (!bloc || !bloc.fichierChemin || !bloc.fichierNom) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  if (session.user.role !== "PROF") {
    const utilisateur = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { classe: true },
    });

    const accesAutorise =
      bloc.cours.publie && utilisateur?.classe?.niveau === bloc.cours.niveau;

    if (!accesAutorise) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
  }

  const inline = request.nextUrl.searchParams.get("inline") === "1";
  const url = await creerUrlTelechargement(
    { chemin: bloc.fichierChemin, nom: bloc.fichierNom },
    { inline }
  );
  return NextResponse.redirect(url);
}
