import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sauvegarderProgression, ProgressionError } from "@/lib/progression";
import { limiterFrequence } from "@/lib/limite-acces";

const LIMITE_SAUVEGARDES = 60;
const FENETRE_MS = 60_000;

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return NextResponse.json({ error: "Connecte-toi pour sauvegarder ta progression." }, { status: 401 });
  }

  const autorise = await limiterFrequence(
    `progression:${session.user.id}`,
    LIMITE_SAUVEGARDES,
    FENETRE_MS
  );
  if (!autorise) {
    return NextResponse.json({ error: "Trop de sauvegardes en peu de temps." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { coursId, exerciceId, code } = body as Record<string, unknown>;
  if (
    typeof coursId !== "string" ||
    typeof exerciceId !== "string" ||
    typeof code !== "string"
  ) {
    return NextResponse.json({ error: "Champs manquants ou invalides." }, { status: 400 });
  }

  try {
    await sauvegarderProgression({ eleveId: session.user.id, coursId, exerciceId, code });
  } catch (error) {
    if (error instanceof ProgressionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Cause la plus probable : coursId inexistant (contrainte de clé étrangère).
    return NextResponse.json({ error: "Cours introuvable." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
