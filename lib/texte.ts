// Normalisation pour une recherche insensible à la casse et aux accents (ex:
// "circuits" doit trouver "Circuits logiques") — voir components/recherche-cours.tsx.
export function normaliserRecherche(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
