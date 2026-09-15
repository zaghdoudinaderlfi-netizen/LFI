import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { enregistrerFeedback, FeedbackError } from "@/lib/cours-feedback";
import { limiterFrequence } from "@/lib/limite-acces";
import { reponseDemoBloquee } from "@/lib/demo-guard";

const LIMITE_ENVOIS = 30;
const FENETRE_MS = 60_000;

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return NextResponse.json({ error: "Connecte-toi pour donner ton avis." }, { status: 401 });
  }
  if (session.user.isDemo) return reponseDemoBloquee();

  const autorise = await limiterFrequence(
    `cours-feedback:${session.user.id}`,
    LIMITE_ENVOIS,
    FENETRE_MS
  );
  if (!autorise) {
    return NextResponse.json({ error: "Trop d'envois en peu de temps." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { coursId, avis } = body as Record<string, unknown>;
  if (typeof coursId !== "string" || (avis !== "POSITIF" && avis !== "NEGATIF")) {
    return NextResponse.json({ error: "Champs manquants ou invalides." }, { status: 400 });
  }

  try {
    await enregistrerFeedback({ eleveId: session.user.id, coursId, avis });
  } catch (error) {
    if (error instanceof FeedbackError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    // Cause la plus probable : coursId inexistant (contrainte de clé étrangère).
    return NextResponse.json({ error: "Cours introuvable." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
