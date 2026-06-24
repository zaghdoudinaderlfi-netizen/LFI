import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  creerUrlTelechargementSoumission,
  obtenirSoumissionAvecAcces,
  SoumissionError,
} from "@/lib/soumissions";

// Retire les accents, garde les majuscules, remplace les caractères non-alphanum par "-".
function slugifierTitre(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Retire les accents et caractères non-alphanum, conserve la casse d'origine.
function slugifierNom(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .trim();
}

// "dupont" → "Dupont", "DUPONT" → "Dupont"
function capitaliser(mot: string): string {
  if (!mot) return mot;
  return mot.charAt(0).toUpperCase() + mot.slice(1).toLowerCase();
}

// Produit "Nom_Prenom" pour un élève, ou "Nom1_Prenom1-Nom2_Prenom2" pour un groupe.
function partiesEleve(nom: string, prenom: string | null): string {
  const n = capitaliser(slugifierNom(nom));
  const p = prenom ? capitaliser(slugifierNom(prenom)) : null;
  return p ? `${n}_${p}` : n;
}

function construireNomFichier(
  soumission: NonNullable<Awaited<ReturnType<typeof obtenirSoumissionAvecAcces>>>,
  extension: string
): string {
  const auteur = soumission.eleve;
  const partieAuteur = partiesEleve(auteur.nom, auteur.prenom ?? null);

  const partiesMembres = soumission.membres.map((m) =>
    partiesEleve(m.eleve.nom, m.eleve.prenom ?? null)
  );

  const titreCours = slugifierTitre(soumission.exercice.cours.titre).slice(0, 30).replace(/-+$/, "");

  const parties = [partieAuteur, ...partiesMembres, titreCours].filter(Boolean);
  return `${parties.join("-")}.${extension}`;
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
