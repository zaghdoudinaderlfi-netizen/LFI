import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { creerUrlTelechargementLogiciel, obtenirLogiciel } from "@/lib/logiciels";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  const logiciel = await obtenirLogiciel(id);
  if (!logiciel || !logiciel.fichierChemin || !logiciel.fichierNom) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const inline = request.nextUrl.searchParams.get("inline") === "1";
  const url = await creerUrlTelechargementLogiciel(
    { fichierChemin: logiciel.fichierChemin, fichierNom: logiciel.fichierNom },
    { inline }
  );
  return NextResponse.redirect(url);
}
