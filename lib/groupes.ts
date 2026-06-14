// Types et constantes pour le travail en groupe (binôme/trio), sans dépendance
// à Prisma : ce module peut être importé depuis des composants client.

export type CamaradeClasse = { id: string; nom: string; prenom: string | null };

// Un groupe = l'élève qui rend + au plus 2 coéquipiers.
export const MAX_COEQUIPIERS = 2;

// Nom du champ HTML utilisé pour sélectionner les coéquipiers dans les
// formulaires de dépôt de devoir.
export const NOM_CHAMP_COEQUIPIERS = "coequipierId";
