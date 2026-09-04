import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  estNomPageValide,
  lirePageInteractive,
  retirerCorrections,
  activerCorrections,
} from "@/lib/cours-interactif";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fichier: string }> }
) {
  const { fichier } = await params;

  if (!estNomPageValide(fichier)) {
    return new NextResponse("Page introuvable.", { status: 404 });
  }

  let html: string;
  try {
    html = await lirePageInteractive(fichier);
  } catch {
    return new NextResponse("Page introuvable.", { status: 404 });
  }

  const [session, cours] = await Promise.all([
    auth(),
    prisma.cours.findFirst({
      where: { pageInteractive: fichier },
      select: { correctionVisible: true },
    }),
  ]);

  // Le prof voit toujours les corrections ; l'élève seulement quand le
  // toggle du dashboard est activé pour ce cours.
  const corrigeAutorise =
    session?.user?.role === "PROF" || cours?.correctionVisible === true;

  return new NextResponse(
    corrigeAutorise ? activerCorrections(html) : retirerCorrections(html),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}
