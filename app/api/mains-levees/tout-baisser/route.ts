import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { baisserToutesLesMains } from "@/lib/mains-levees";

/** Le prof baisse toutes les mains levées d'un coup (fin d'activité orale). */
export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return NextResponse.json({ error: "Accès réservé aux professeurs." }, { status: 401 });
  }

  await baisserToutesLesMains();
  return NextResponse.json({ ok: true });
}
