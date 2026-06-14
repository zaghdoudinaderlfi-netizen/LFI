import { Niveau } from "@prisma/client";
import { prisma } from "./prisma";

export async function compterNotificationsNonLues(userId: string) {
  return prisma.notification.count({
    where: { destinataireId: userId, lu: false },
  });
}

export async function listerNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { destinataireId: userId },
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

export async function notifierElevesDuNiveau(
  niveau: Niveau,
  message: string,
  lien?: string
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
    })),
  });
}

export async function notifierProfs(message: string, lien?: string) {
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
    })),
  });
}
