// Helper d'affichage du nom des utilisateurs (élèves/profs) : combine
// prénom et nom, sans planter si le prénom n'est pas encore renseigné
// (comptes créés avant l'ajout du champ "prenom").

export function formaterNomComplet({ nom, prenom }: { nom: string; prenom?: string | null }): string {
  const prenomNettoye = prenom?.trim();
  return prenomNettoye ? `${prenomNettoye} ${nom}` : nom;
}

/**
 * Parse une date "AAAA-MM-JJ" (input HTML `type="date"`) et vérifie sa
 * plausibilité (pas dans le futur, pas absurde). Utilisé à l'inscription et
 * quand un élève complète sa date de naissance depuis son profil — sert à
 * vérifier son identité lors d'une réinitialisation de mot de passe en
 * libre-service (voir /mot-de-passe-oublie).
 */
export function parserDateNaissance(valeur: string): { date: Date } | { erreur: string } {
  const date = new Date(`${valeur}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return { erreur: "Date de naissance invalide." };
  }

  const maintenant = new Date();
  if (date > maintenant) {
    return { erreur: "La date de naissance ne peut pas être dans le futur." };
  }

  const ageEnAnnees = (maintenant.getTime() - date.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (ageEnAnnees > 100) {
    return { erreur: "Date de naissance invalide." };
  }

  return { date };
}
