import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verrouillerEleve } from "@/lib/examen";

/**
 * Verrouillage dur déclenché côté client dès qu'un élève quitte l'écran
 * pendant un exercice en mode examen (visibilitychange/blur). Appelé en
 * `fetch(..., { keepalive: true })` pour survivre même si l'onglet se ferme
 * juste après.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const exerciceId = body?.exerciceId;
  if (typeof exerciceId !== "string" || !exerciceId) {
    return NextResponse.json({ error: "Exercice invalide." }, { status: 400 });
  }

  const exercice = await prisma.exercice.findUnique({
    where: { id: exerciceId },
    select: { modeExamen: true },
  });
  if (!exercice?.modeExamen) {
    return NextResponse.json({ error: "Cet exercice n'est pas en mode examen." }, { status: 400 });
  }

  await verrouillerEleve(exerciceId, session.user.id, "Sortie de l'écran pendant l'épreuve");

  return NextResponse.json({ ok: true });
}
