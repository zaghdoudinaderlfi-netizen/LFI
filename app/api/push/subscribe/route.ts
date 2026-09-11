import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Enregistre (ou met à jour) l'abonnement push d'un appareil pour
 * l'utilisateur connecté — appelé côté client juste après
 * pushManager.subscribe() (voir components/push-notification-prompt.tsx).
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const cleAuth = body?.keys?.auth;

  if (typeof endpoint !== "string" || typeof p256dh !== "string" || typeof cleAuth !== "string") {
    return NextResponse.json({ error: "Abonnement invalide." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth: cleAuth, userId: session.user.id },
    // Le même endpoint peut se retrouver rattaché à un autre compte si
    // l'appareil est partagé (connexion différente sur le même navigateur).
    update: { p256dh, auth: cleAuth, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
