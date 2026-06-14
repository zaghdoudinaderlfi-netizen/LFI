import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { creerUrlSujetDevoir, obtenirDevoir, DevoirError } from "@/lib/devoirs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  const devoir = await obtenirDevoir(id);
  if (!devoir) {
    return NextResponse.json({ error: "Devoir introuvable." }, { status: 404 });
  }

  if (session.user.role !== "PROF") {
    const [cours, utilisateur] = await Promise.all([
      prisma.cours.findUnique({ where: { id: devoir.coursId } }),
      prisma.user.findUnique({ where: { id: session.user.id }, include: { classe: true } }),
    ]);

    const accesAutorise = cours?.publie && utilisateur?.classe?.niveau === cours.niveau;
    if (!accesAutorise) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
  }

  try {
    const inline = request.nextUrl.searchParams.get("inline") === "1";
    const url = await creerUrlSujetDevoir(devoir, { inline });
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof DevoirError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
