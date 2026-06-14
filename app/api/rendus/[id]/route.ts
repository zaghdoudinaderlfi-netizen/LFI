import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  creerUrlTelechargementSoumission,
  obtenirSoumissionAvecAcces,
  SoumissionError,
} from "@/lib/soumissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  const soumission = await obtenirSoumissionAvecAcces(id);
  if (!soumission) {
    return NextResponse.json({ error: "Rendu introuvable." }, { status: 404 });
  }

  const accesAutorise = session.user.role === "PROF" || soumission.eleveId === session.user.id;
  if (!accesAutorise) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const inline = request.nextUrl.searchParams.get("inline") === "1";
    const url = await creerUrlTelechargementSoumission(soumission, { inline });
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof SoumissionError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
