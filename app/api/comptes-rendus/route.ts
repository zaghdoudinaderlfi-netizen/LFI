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

  // multipart/form-data plutôt que JSON : le widget peut joindre un fichier
  // (voir injecterWidgetDepot, lib/cours-interactif.ts). `camaradesIds`
  // voyage en JSON dans un champ texte du formulaire.
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const coursId = formData.get("coursId");
  const travail = formData.get("travail");
  const site = formData.get("site");
  const camaradesIdsRaw = formData.get("camaradesIds");
  const fichier = formData.get("fichier");

  // Honeypot : un champ invisible pour un humain, que les robots de spam
  // remplissent automatiquement. On répond succès sans rien enregistrer,
  // pour ne pas leur signaler que la requête a été détectée.
  if (typeof site === "string" && site.trim() !== "") {
    return NextResponse.json({ id: "ignore", dateDepot: new Date() }, { status: 201 });
  }

  if (typeof coursId !== "string") {
    return NextResponse.json({ error: "Champs manquants ou invalides." }, { status: 400 });
  }

  let camaradesIds: string[] | undefined;
  if (typeof camaradesIdsRaw === "string" && camaradesIdsRaw.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(camaradesIdsRaw);
    } catch {
      return NextResponse.json({ error: "Champs manquants ou invalides." }, { status: 400 });
    }
    if (!(Array.isArray(parsed) && parsed.every((id) => typeof id === "string"))) {
      return NextResponse.json({ error: "Champs manquants ou invalides." }, { status: 400 });
    }
    camaradesIds = parsed;
  }

  try {
    const compteRendu = await deposerCompteRendu({
      coursId,
      eleveId: session.user.id,
      camaradesIds,
      travail: typeof travail === "string" ? travail : undefined,
      fichier: fichier instanceof File && fichier.size > 0 ? fichier : undefined,
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
