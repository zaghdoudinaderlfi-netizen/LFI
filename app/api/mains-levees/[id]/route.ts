import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { baisserLaMainParId } from "@/lib/mains-levees";

/** Le prof baisse la main d'un élève précis depuis la popup (interrogé, ou pour nettoyer). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return NextResponse.json({ error: "Accès réservé aux professeurs." }, { status: 401 });
  }

  const { id } = await params;
  await baisserLaMainParId(id);
  return NextResponse.json({ ok: true });
}
