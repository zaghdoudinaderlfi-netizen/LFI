import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deposerCompteRendu, CompteRenduError } from "@/lib/comptes-rendus";
import { adresseIpAppelant, limiterFrequence } from "@/lib/limite-acces";

const LIMITE_DEPOTS = 5;
const FENETRE_DEPOTS_MS = 60_000;

export async function POST(request: Request) {
  // Un dépôt engage une identité (nom, classe) et déclenche une notif prof :
  // il faut donc un compte élève, pas seulement connaître l'id du cours
  // (visible dans le widget public, donc pas un secret).
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return NextResponse.json({ error: "Connecte-toi pour déposer un compte-rendu." }, { status: 401 });
  }

  const ip = await adresseIpAppelant();
  const autorise = await limiterFrequence(`cr:${ip}`, LIMITE_DEPOTS, FENETRE_DEPOTS_MS);
  if (!autorise) {
    return NextResponse.json(
      { error: "Trop de dépôts en peu de temps, réessaie dans une minute." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { coursId, camaradesIds, travail, site } = body as Record<string, unknown>;

  // Honeypot : un champ invisible pour un humain, que les robots de spam
  // remplissent automatiquement. On répond succès sans rien enregistrer,
  // pour ne pas leur signaler que la requête a été détectée.
  if (typeof site === "string" && site.trim() !== "") {
    return NextResponse.json({ id: "ignore", dateDepot: new Date() }, { status: 201 });
  }

  if (typeof coursId !== "string") {
    return NextResponse.json({ error: "Champs manquants ou invalides." }, { status: 400 });
  }
  if (
    camaradesIds !== undefined &&
    !(Array.isArray(camaradesIds) && camaradesIds.every((id) => typeof id === "string"))
  ) {
    return NextResponse.json({ error: "Champs manquants ou invalides." }, { status: 400 });
  }

  try {
    const compteRendu = await deposerCompteRendu({
      coursId,
      eleveId: session.user.id,
      camaradesIds: Array.isArray(camaradesIds) ? (camaradesIds as string[]) : undefined,
      travail: typeof travail === "string" ? travail : undefined,
    });
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
