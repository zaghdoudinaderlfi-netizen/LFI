// Helper d'affichage du nom des utilisateurs (élèves/profs) : combine
// prénom et nom, sans planter si le prénom n'est pas encore renseigné
// (comptes créés avant l'ajout du champ "prenom").

export function formaterNomComplet({ nom, prenom }: { nom: string; prenom?: string | null }): string {
  const prenomNettoye = prenom?.trim();
  return prenomNettoye ? `${prenomNettoye} ${nom}` : nom;
}
