import { NextResponse } from "next/server";
import { inscrireEleve, InscriptionError } from "@/lib/inscription";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  const { nom, prenom, email, motDePasse, codeInscription } = body as Record<
    string,
    unknown
  >;

  if (
    typeof nom !== "string" ||
    typeof prenom !== "string" ||
    typeof email !== "string" ||
    typeof motDePasse !== "string" ||
    typeof codeInscription !== "string"
  ) {
    return NextResponse.json(
      { error: "Champs manquants ou invalides." },
      { status: 400 }
    );
  }

  try {
    const user = await inscrireEleve({ nom, prenom, email, motDePasse, codeInscription });
    return NextResponse.json(
      { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof InscriptionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
