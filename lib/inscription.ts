import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { parserDateNaissance } from "./utilisateurs";

export class InscriptionError extends Error {}

export async function inscrireEleve({
  nom,
  prenom,
  email,
  motDePasse,
  codeInscription,
  dateNaissance,
}: {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  codeInscription: string;
  dateNaissance: string;
}) {
  if (!nom || !prenom || !email || !motDePasse || !codeInscription || !dateNaissance) {
    throw new InscriptionError("Tous les champs sont obligatoires.");
  }

  if (motDePasse.length < 8) {
    throw new InscriptionError(
      "Le mot de passe doit contenir au moins 8 caractères."
    );
  }

  const resultatDate = parserDateNaissance(dateNaissance);
  if ("erreur" in resultatDate) {
    throw new InscriptionError(resultatDate.erreur);
  }
  const dateNaissanceParsee = resultatDate.date;

  const classe = await prisma.classe.findUnique({
    where: { codeInscription },
  });

  if (!classe) {
    throw new InscriptionError("Code de classe invalide.");
  }

  const existant = await prisma.user.findUnique({ where: { email } });
  if (existant) {
    throw new InscriptionError("Un compte existe déjà avec cet email.");
  }

  const motDePasseHash = await bcrypt.hash(motDePasse, 10);

  return prisma.user.create({
    data: {
      nom,
      prenom,
      email,
      motDePasse: motDePasseHash,
      role: "ELEVE",
      classeId: classe.id,
      dateNaissance: dateNaissanceParsee,
    },
  });
}
