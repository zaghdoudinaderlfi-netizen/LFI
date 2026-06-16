import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "PROF") redirect("/eleve");

  const [classes, eleves] = await Promise.all([
    prisma.classe.findMany({
      orderBy: [{ niveau: "asc" }, { nom: "asc" }],
      select: { id: true, nom: true, niveau: true, anneeScolaire: true },
    }),
    prisma.user.findMany({
      where: { role: "ELEVE" },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        doitChangerMdp: true,
        classeId: true,
        classe: {
          select: { id: true, nom: true, niveau: true },
        },
      },
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="animate-fade-in-up">
        <h1 className="page-title">Gestion des élèves</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Réinitialise les mots de passe, corrige les noms et change les classes.
        </p>
      </div>

      <AdminClient eleves={eleves} classes={classes} />
    </div>
  );
}
