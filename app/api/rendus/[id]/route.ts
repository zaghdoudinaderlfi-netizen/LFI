import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  creerUrlTelechargementSoumission,
  obtenirSoumissionAvecAcces,
  SoumissionError,
} from "@/lib/soumissions";

function slugifier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function construireNomFichier(
  soumission: NonNullable<Awaited<ReturnType<typeof obtenirSoumissionAvecAcces>>>,
  extension: string
): string {
  const auteur = soumission.eleve;
  const partiesNom = [auteur.nom, auteur.prenom].filter((v): v is string => !!v).map(slugifier);

  const membres = soumission.membres.flatMap((m) =>
    [m.eleve.nom, m.eleve.prenom].filter((v): v is string => !!v).map(slugifier)
  );

  const titreCours = slugifier(soumission.exercice.cours.titre).slice(0, 30).replace(/-+$/, "");

  const parties = [...partiesNom, ...membres, titreCours].filter(Boolean);
  return `${parties.join("_")}.${extension}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  const soumission = await obtenirSoumissionAvecAcces(id);
  if (!soumission) {
    return NextResponse.json({ error: "Rendu introuvable." }, { status: 404 });
  }

  const accesAutorise =
    session.user.role === "PROF" ||
    soumission.eleveId === session.user.id ||
    soumission.membres.some((m) => m.eleveId === session.user.id);
  if (!accesAutorise) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const inline = request.nextUrl.searchParams.get("inline") === "1";
    const extension = soumission.fichierNom?.split(".").pop() ?? "pdf";
    const nomFichier = inline ? undefined : construireNomFichier(soumission, extension);
    const url = await creerUrlTelechargementSoumission(soumission, { inline, nomFichier });
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof SoumissionError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
