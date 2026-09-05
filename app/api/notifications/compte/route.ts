import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { compterNotificationsNonLuesParType } from "@/lib/notifications";

/** Compte non lues par type — interrogé périodiquement côté client pour le son de notification. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const compte = await compterNotificationsNonLuesParType(session.user.id);
  return NextResponse.json(compte);
}
