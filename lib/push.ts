import "server-only";
import webpush from "web-push";
import { prisma } from "./prisma";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

const pushConfigure = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT);

if (pushConfigure) {
  webpush.setVapidDetails(VAPID_SUBJECT!, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);
}

export type ChargePush = {
  title: string;
  body: string;
  url?: string;
};

/**
 * Envoie une notification push à tous les appareils abonnés d'un
 * utilisateur. Ne fait rien si les clés VAPID ne sont pas configurées
 * (variables d'environnement absentes) — permet de déployer sans casser le
 * reste de l'app tant que la fonctionnalité n'est pas activée partout.
 * Retire silencieusement les abonnements expirés/révoqués (404/410)
 * rencontrés en cours d'envoi.
 */
export async function envoyerPushUtilisateur(userId: string, charge: ChargePush): Promise<void> {
  if (!pushConfigure) return;

  const abonnements = await prisma.pushSubscription.findMany({ where: { userId } });
  if (abonnements.length === 0) return;

  const payload = JSON.stringify(charge);

  await Promise.all(
    abonnements.map(async (abonnement) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: abonnement.endpoint,
            keys: { p256dh: abonnement.p256dh, auth: abonnement.auth },
          },
          payload
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: abonnement.id } }).catch(() => {});
        }
      }
    })
  );
}

/** Même chose que envoyerPushUtilisateur, pour plusieurs destinataires à la fois. */
export async function envoyerPushUtilisateurs(userIds: string[], charge: ChargePush): Promise<void> {
  if (!pushConfigure || userIds.length === 0) return;
  await Promise.all(userIds.map((id) => envoyerPushUtilisateur(id, charge)));
}
