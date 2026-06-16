// Banque de messages fixes pour la mascotte.
// Pour brancher l'IA plus tard : appeler configurerResolver() avec une fonction async.

export type CategorieMessage =
  | "bienvenue_matin"
  | "bienvenue_apresmidi"
  | "bienvenue_soir"
  | "encouragement"
  | "motivation"
  | "conseil"
  | "sommeil"
  | "reveil";

const BANQUE: Record<CategorieMessage, string[]> = {
  bienvenue_matin: [
    "Bonjour ! Prêt pour une super journée ? ☀️",
    "Bonne matinée ! Qu'est-ce qu'on apprend aujourd'hui ?",
    "Salut ! Le savoir t'attend, en selle !",
    "Bonjour ! Un bon café... euh, un bon cours, ça part ? ☕",
  ],
  bienvenue_apresmidi: [
    "Bon après-midi ! On s'y met ?",
    "Coucou ! Le meilleur moment pour apprendre, c'est maintenant.",
    "Re ! Prêt pour une session productive ? 💪",
    "L'après-midi, le cerveau est en pleine forme. Allons-y !",
  ],
  bienvenue_soir: [
    "Bonsoir ! Une dernière session avant de dormir ?",
    "Salut ! Le soir, c'est souvent le meilleur moment pour mémoriser.",
    "Bonsoir ! Allez, encore un petit effort ! 🌙",
    "La nuit porte conseil... et les révisions aussi !",
  ],
  encouragement: [
    "Bravo ! Tu es sur la bonne voie ! 🎉",
    "Super travail ! Continue comme ça !",
    "Tu assures ! Chaque effort compte.",
    "Excellent ! Je suis fier de toi ! ⭐",
    "C'est top ça ! Tu progresses vraiment.",
    "Mission accomplie ! Tu peux être fier·e. 🏆",
    "Bien joué ! Tu avances pas à pas.",
  ],
  motivation: [
    "Tu es capable de grandes choses !",
    "Un petit effort maintenant, une grande fierté plus tard.",
    "Chaque leçon apprise est une victoire. 🏅",
    "Tu peux le faire ! Je crois en toi.",
    "L'important, c'est de ne jamais lâcher.",
    "Même les experts ont commencé par apprendre.",
    "Les erreurs font partie du chemin. Pas de stress !",
    "Pas de grande réussite sans un peu d'efforts.",
  ],
  conseil: [
    "Commence par le plus difficile, le reste sera plus facile. 🧠",
    "Fais une pause de 5 min toutes les 25 min — ça aide vraiment !",
    "Résumer en quelques mots, c'est la meilleure façon de retenir.",
    "Un seul objectif à la fois, c'est plus efficace.",
    "Répète à voix haute ce que tu viens d'apprendre.",
    "Pas de distraction ! Téléphone en mode silencieux 📵",
    "Relis tes notes le soir : la mémoire consolide pendant le sommeil.",
    "Essaie d'expliquer la leçon comme si tu l'enseignais à quelqu'un.",
  ],
  sommeil: [
    "Zzz... Je fais un petit somme... 😴",
    "Je me repose un peu... reviens vite !",
    "Zzz... Je rêve de polynômes... Zzz",
    "Mode veille activé... Zzz 💤",
  ],
  reveil: [
    "Me revoilà ! 😄",
    "Je suis là si tu as besoin !",
    "Réveillé ! Prêt à t'accompagner.",
    "Ouh là, j'ai failli rater quelque chose !",
    "Debout ! On reprend ? 💪",
  ],
};

function piocherAuHasard<T>(tableau: T[]): T {
  return tableau[Math.floor(Math.random() * tableau.length)];
}

export function categorieParHeure(): CategorieMessage {
  const heure = new Date().getHours();
  if (heure < 13) return "bienvenue_matin";
  if (heure < 18) return "bienvenue_apresmidi";
  return "bienvenue_soir";
}

export function piocherMessage(categorie: CategorieMessage): string {
  return piocherAuHasard(BANQUE[categorie] ?? BANQUE.motivation);
}

// ── Point d'extension IA ─────────────────────────────────────────────────────
// Pour brancher un modèle plus tard, appeler configurerResolver() au démarrage
// de l'app avec une fonction qui retourne une Promise<string>.
export type ResolverMessage = (categorie: CategorieMessage) => Promise<string> | string;

let _resolver: ResolverMessage = (categorie) => piocherMessage(categorie);

export function configurerResolver(fn: ResolverMessage) {
  _resolver = fn;
}

export async function obtenirMessage(categorie: CategorieMessage): Promise<string> {
  return _resolver(categorie);
}

// Helper pour déclencher un encouragement depuis n'importe quel composant client
export function declencherEncouragementMascotte(texte?: string) {
  const msg = texte ?? piocherMessage("encouragement");
  window.dispatchEvent(
    new CustomEvent("mascotte:encouragement", { detail: { texte: msg } })
  );
}

// Helper pour marquer un encouragement depuis une Server Action
// (via sessionStorage, récupéré au prochain rendu du tableau de bord)
export function marquerEncouragementPendant(texte?: string) {
  const msg = texte ?? piocherMessage("encouragement");
  sessionStorage.setItem("mascotte:pending", JSON.stringify({ texte: msg }));
}
