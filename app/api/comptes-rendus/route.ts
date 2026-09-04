import { NextResponse } from "next/server";
import { deposerCompteRendu, CompteRenduError } from "@/lib/comptes-rendus";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { coursId, noms } = body as Record<string, unknown>;

  if (typeof coursId !== "string" || typeof noms !== "string") {
    return NextResponse.json({ error: "Champs manquants ou invalides." }, { status: 400 });
  }

  try {
    const compteRendu = await deposerCompteRendu({ coursId, noms });
    return NextResponse.json(
      { id: compteRendu.id, dateDepot: compteRendu.dateDepot },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof CompteRenduError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
