import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { obtenirVerrouActif } from "@/lib/examen";

/** Interrogé par l'écran de verrouillage côté élève pour détecter un déblocage prof sans rafraîchir manuellement. */
export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const exerciceId = new URL(request.url).searchParams.get("exerciceId");
  if (!exerciceId) {
    return NextResponse.json({ error: "Exercice invalide." }, { status: 400 });
  }

  const verrou = await obtenirVerrouActif(exerciceId, session.user.id);
  return NextResponse.json({ verrouille: !!verrou });
}
