import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listerMainsLeveesActives } from "@/lib/mains-levees";

/** Interrogée périodiquement par la popup prof (voir components/prof/mains-levees-bulle.tsx). */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return NextResponse.json({ error: "Accès réservé aux professeurs." }, { status: 401 });
  }

  const mains = await listerMainsLeveesActives();
  return NextResponse.json(mains);
}
