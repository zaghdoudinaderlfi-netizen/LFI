import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export class InscriptionError extends Error {}

/** Parse une date "AAAA-MM-JJ" (input HTML date) et vérifie sa plausibilité. */
function parserDateNaissance(valeur: string): Date {
  const date = new Date(`${valeur}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new InscriptionError("Date de naissance invalide.");
  }

  const maintenant = new Date();
  if (date > maintenant) {
    throw new InscriptionError("La date de naissance ne peut pas être dans le futur.");
  }

  const ageEnAnnees = (maintenant.getTime() - date.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (ageEnAnnees > 100) {
    throw new InscriptionError("Date de naissance invalide.");
  }

  return date;
}

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

  const dateNaissanceParsee = parserDateNaissance(dateNaissance);

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
