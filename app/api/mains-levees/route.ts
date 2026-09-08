import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { leverLaMain, baisserLaMain, mainEstLevee } from "@/lib/mains-levees";

/** État de la main de l'élève connecté — interrogé au montage du bouton et
 * périodiquement pour détecter une baisse déclenchée depuis la popup prof. */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const actif = await mainEstLevee(session.user.id);
  return NextResponse.json({ actif });
}

/** L'élève lève la main. */
export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  await leverLaMain(session.user.id);
  return NextResponse.json({ actif: true });
}

/** L'élève baisse lui-même sa main (avant que le prof ne l'interroge). */
export async function DELETE() {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  await baisserLaMain(session.user.id);
  return NextResponse.json({ actif: false });
}
