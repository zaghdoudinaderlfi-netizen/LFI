import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Battement de coeur de présence — appelé périodiquement côté élève (voir components/eleve/presence-heartbeat.tsx). */
export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { derniereActivite: new Date() },
  });

  return NextResponse.json({ ok: true });
}
