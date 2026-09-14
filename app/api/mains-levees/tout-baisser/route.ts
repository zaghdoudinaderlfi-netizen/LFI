import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { baisserToutesLesMains } from "@/lib/mains-levees";
import { reponseDemoBloquee } from "@/lib/demo-guard";

/** Le prof baisse toutes les mains levées d'un coup (fin d'activité orale). */
export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return NextResponse.json({ error: "Accès réservé aux professeurs." }, { status: 401 });
  }
  // Cette action baisse les mains de TOUS les vrais élèves, pas seulement
  // ceux de la Classe Démo — bloquée entièrement plutôt que filtrée.
  if (session.user.isDemo) return reponseDemoBloquee();

  await baisserToutesLesMains();
  return NextResponse.json({ ok: true });
}
