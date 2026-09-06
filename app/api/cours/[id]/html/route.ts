import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obtenirCoursParId } from "@/lib/cours";
import { cheminCoursSimpleDepuisUrl } from "@/lib/cours-simple";
import { supabaseAdmin, BUCKET_COURS_SIMPLE } from "@/lib/supabase";

/**
 * Sert le fichier HTML d'un cours "mode simplifié" en le retéléchargeant
 * depuis Supabase Storage et en le renvoyant avec un Content-Type explicite.
 * Nécessaire car l'URL publique Supabase force `Content-Type: text/plain`
 * et une CSP `sandbox` sur les objets HTML (protection anti-XSS côté
 * Storage), ce qui fait que le navigateur affiche le code source au lieu
 * d'afficher la page dans l'iframe élève.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cours = await obtenirCoursParId(id);
  if (!cours || cours.typeSimple !== "HTML" || !cours.fichierUrl) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const session = cours.estPublic ? null : await auth();

  if (!cours.estPublic && !session?.user) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  if (session && session.user.role !== "PROF") {
    const utilisateur = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { classe: true },
    });

    const accesAutorise = cours.publie && utilisateur?.classe?.niveau === cours.niveau;

    if (!accesAutorise) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
  }

  const chemin = cheminCoursSimpleDepuisUrl(cours.fichierUrl);
  if (!chemin) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin.storage.from(BUCKET_COURS_SIMPLE).download(chemin);
  if (error || !data) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const buffer = await data.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=60",
    },
  });
}
