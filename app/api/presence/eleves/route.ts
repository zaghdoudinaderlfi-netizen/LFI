import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listerElevesAvecPresence } from "@/lib/presence";

/** Liste des classes/élèves avec statut de connexion — pour la bulle de présence prof. */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return NextResponse.json({ error: "Accès réservé aux professeurs." }, { status: 401 });
  }

  const classes = await listerElevesAvecPresence();
  return NextResponse.json(classes);
}
