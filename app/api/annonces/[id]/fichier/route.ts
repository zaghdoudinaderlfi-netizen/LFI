import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { creerUrlFichierAnnonce, AnnonceError } from "@/lib/annonces";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/connexion", _request.url));
  }

  const annonce = await prisma.annonce.findUnique({ where: { id } });
  if (!annonce) {
    return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  }

  try {
    const url = await creerUrlFichierAnnonce(annonce);
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof AnnonceError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
