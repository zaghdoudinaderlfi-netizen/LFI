import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { obtenirAnnonceActive } from "@/lib/annonces";

/** Interrogée périodiquement par le tableau de bord élève (voir
 * components/eleve/annonce-bulle.tsx) pour détecter une nouvelle annonce
 * — ou sa disparition — sans recharger la page. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(null, { status: 401 });
  }

  const annonce = await obtenirAnnonceActive();
  if (!annonce) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    id: annonce.id,
    message: annonce.message,
    fichierNom: annonce.fichierNom,
    fichierTaille: annonce.fichierTaille,
  });
}
