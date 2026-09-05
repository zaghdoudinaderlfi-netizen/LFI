import { Matiere, Niveau, TypeNotification } from "@prisma/client";
import { prisma } from "./prisma";

export async function compterNotificationsNonLues(userId: string) {
  return prisma.notification.count({
    where: { destinataireId: userId, lu: false },
  });
}

/** Compte non lues par type — pour le son de notification côté client. */
export async function compterNotificationsNonLuesParType(userId: string) {
  const groupes = await prisma.notification.groupBy({
    by: ["type"],
    where: { destinataireId: userId, lu: false },
    _count: true,
  });

  const compte = { GENERALE: 0, NOTE: 0 };
  for (const g of groupes) compte[g.type] = g._count;
  return compte;
}

export async function listerNotifications(userId: string, matiere?: Matiere) {
  return prisma.notification.findMany({
    where: { destinataireId: userId, ...(matiere ? { matiere } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function marquerNotificationLue(id: string, userId: string) {
  await prisma.notification.updateMany({
    where: { id, destinataireId: userId },
    data: { lu: true },
  });
}

export async function marquerToutesNotificationsLues(userId: string) {
  await prisma.notification.updateMany({
    where: { destinataireId: userId, lu: false },
    data: { lu: true },
  });
}

/** Notifie un seul destinataire (ex. une note reçue) — voir aussi les variantes de diffusion ci-dessous. */
export async function notifierEleve(
  eleveId: string,
  message: string,
  lien?: string,
  matiere?: Matiere,
  type: TypeNotification = "GENERALE"
) {
  await prisma.notification.create({
    data: { destinataireId: eleveId, message, lien, matiere, type },
  });
}

export async function notifierElevesDuNiveau(
  niveau: Niveau,
  message: string,
  lien?: string,
  matiere?: Matiere,
  type: TypeNotification = "GENERALE"
) {
  const eleves = await prisma.user.findMany({
    where: { role: "ELEVE", classe: { niveau } },
    select: { id: true },
  });

  if (eleves.length === 0) return;

  await prisma.notification.createMany({
    data: eleves.map((eleve) => ({
      destinataireId: eleve.id,
      message,
      lien,
      matiere,
      type,
    })),
  });
}

export async function notifierProfs(
  message: string,
  lien?: string,
  matiere?: Matiere,
  type: TypeNotification = "GENERALE"
) {
  const profs = await prisma.user.findMany({
    where: { role: "PROF" },
    select: { id: true },
  });

  if (profs.length === 0) return;

  await prisma.notification.createMany({
    data: profs.map((prof) => ({
      destinataireId: prof.id,
      message,
      lien,
      matiere,
      type,
    })),
  });
}
