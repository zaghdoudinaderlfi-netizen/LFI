// Constructeur d'avatar façon Kahoot, basé sur DiceBear (libre de droits,
// composable). Les élèves choisissent un personnage plein corps puis le
// personnalisent (visage, yeux, coiffure, vêtements, accessoires, fond).
// La config (style + options) est stockée en JSON dans User.avatarOptions.

import { createAvatar } from "@dicebear/core";
import * as botttsNeutral from "@dicebear/bottts-neutral";
import * as openPeeps from "@dicebear/open-peeps";
import * as miniavs from "@dicebear/miniavs";
import * as personas from "@dicebear/personas";

export type AvatarStyleId = "peeps" | "mini" | "personas";

export const AVATAR_STYLES: { id: AvatarStyleId; label: string; description: string }[] = [
  { id: "peeps", label: "Aventurier", description: "Un personnage complet, plein d'expressions et de coiffures" },
  { id: "mini", label: "Mini", description: "Un petit perso tout en couleur, des cheveux au t-shirt" },
  { id: "personas", label: "Perso", description: "Un avatar coloré et stylé" },
];

const STYLE_MODULES: Record<AvatarStyleId, Parameters<typeof createAvatar>[0]> = {
  peeps: openPeeps as unknown as Parameters<typeof createAvatar>[0],
  mini: miniavs as unknown as Parameters<typeof createAvatar>[0],
  personas: personas as unknown as Parameters<typeof createAvatar>[0],
};

/** Valeur sentinelle « aucun » pour les parties optionnelles (lunettes, barbe...). */
export const AUCUN = "_aucun_";

export type AvatarOptions = Record<string, string>;

export type AvatarConfig = {
  style: AvatarStyleId;
  options: AvatarOptions;
};

export type AvatarChoice = { value: string; label: string };

export type AvatarControl = {
  optionKey: string;
  /** Si présent : "Aucun" met cette probabilité à 0, sinon 100. */
  probabilityKey?: string;
  label: string;
  type: "visuel" | "couleur";
  choices: AvatarChoice[];
};

export type AvatarCategory = {
  key: string;
  label: string;
  controls: AvatarControl[];
};

// ───────────────────────────────────────────────
//  Palettes de couleurs (thème techno/espace)
// ───────────────────────────────────────────────

const FOND_CHOICES: AvatarChoice[] = [
  { value: "0b1224", label: "Nuit" },
  { value: "1e1b4b", label: "Indigo" },
  { value: "312e81", label: "Violet" },
  { value: "0c4a6e", label: "Océan" },
  { value: "164e63", label: "Cyan profond" },
  { value: "581c87", label: "Améthyste" },
  { value: "134e4a", label: "Émeraude" },
  { value: "3f3f46", label: "Gris sidéral" },
];

function visuels(controlLabel: string, valeurs: string[]): AvatarChoice[] {
  return valeurs.map((value, index) => ({ value, label: `${controlLabel} ${index + 1}` }));
}

function avecAucun(choix: AvatarChoice[]): AvatarChoice[] {
  return [{ value: AUCUN, label: "Aucun" }, ...choix];
}

// ───────────────────────────────────────────────
//  Catégories par style
// ───────────────────────────────────────────────

export const AVATAR_CATEGORIES: Record<AvatarStyleId, AvatarCategory[]> = {
  // "Aventurier" (Open Peeps) : personnage entier dessiné à la main, plein
  // d'expressions et de coiffures/couvre-chefs. Pilosité faciale optionnelle
  // (désactivée par défaut) pour rester adapté aux ados.
  peeps: [
    {
      key: "visage",
      label: "Visage",
      controls: [
        {
          optionKey: "face",
          label: "Expression",
          type: "visuel",
          choices: [
            { value: "smile", label: "Souriant" },
            { value: "smileBig", label: "Grand sourire" },
            { value: "smileLOL", label: "Mort de rire" },
            { value: "cheeky", label: "Coquin" },
            { value: "awe", label: "Émerveillé" },
            { value: "cute", label: "Mignon" },
            { value: "calm", label: "Zen" },
            { value: "lovingGrin1", label: "Charmeur" },
            { value: "lovingGrin2", label: "Yeux en cœur" },
            { value: "hectic", label: "Stressé" },
            { value: "serious", label: "Sérieux" },
            { value: "suspicious", label: "Méfiant" },
            { value: "tired", label: "Fatigué" },
            { value: "eyesClosed", label: "Yeux fermés" },
            { value: "rage", label: "Énervé" },
            { value: "veryAngry", label: "Furieux" },
          ],
        },
        {
          optionKey: "skinColor",
          label: "Couleur de peau",
          type: "couleur",
          choices: [
            { value: "ffdbb4", label: "Claire" },
            { value: "edb98a", label: "Dorée" },
            { value: "d08b5b", label: "Bronze" },
            { value: "ae5d29", label: "Brune" },
            { value: "694d3d", label: "Foncée" },
          ],
        },
      ],
    },
    {
      key: "cheveux",
      label: "Coiffure & couvre-chef",
      controls: [
        {
          optionKey: "head",
          label: "Coiffure / couvre-chef",
          type: "visuel",
          choices: [
            { value: "afro", label: "Afro" },
            { value: "bangs", label: "Frange" },
            { value: "bantuKnots", label: "Bantu knots" },
            { value: "bun", label: "Chignon" },
            { value: "buns", label: "Couettes" },
            { value: "cornrows", label: "Tresses collées" },
            { value: "dreads1", label: "Dreadlocks" },
            { value: "flatTop", label: "Flat top" },
            { value: "hatBeanie", label: "Bonnet" },
            { value: "hatHip", label: "Casquette" },
            { value: "longCurly", label: "Longs bouclés" },
            { value: "mohawk", label: "Crête" },
            { value: "pomp", label: "Pompadour" },
            { value: "short2", label: "Coupe courte" },
          ],
        },
        {
          optionKey: "headContrastColor",
          label: "Couleur cheveux / couvre-chef",
          type: "couleur",
          choices: [
            { value: "2c1b18", label: "Brun foncé" },
            { value: "e8e1e1", label: "Blanc" },
            { value: "ecdcbf", label: "Blond platine" },
            { value: "d6b370", label: "Blond" },
            { value: "f59797", label: "Rose" },
            { value: "b58143", label: "Caramel" },
            { value: "a55728", label: "Roux" },
            { value: "724133", label: "Châtain" },
            { value: "4a312c", label: "Noir" },
            { value: "c93305", label: "Rouge vif" },
          ],
        },
      ],
    },
    {
      key: "vetements",
      label: "Vêtements",
      controls: [
        {
          optionKey: "clothingColor",
          label: "Couleur du haut",
          type: "couleur",
          choices: [
            { value: "e78276", label: "Corail" },
            { value: "ffcf77", label: "Jaune" },
            { value: "fdea6b", label: "Citron" },
            { value: "78e185", label: "Vert" },
            { value: "9ddadb", label: "Turquoise" },
            { value: "8fa7df", label: "Bleu" },
            { value: "e279c7", label: "Magenta" },
          ],
        },
      ],
    },
    {
      key: "accessoires",
      label: "Accessoires",
      controls: [
        {
          optionKey: "accessories",
          probabilityKey: "accessoriesProbability",
          label: "Lunettes",
          type: "visuel",
          choices: avecAucun([
            { value: "glasses", label: "Lunettes rondes" },
            { value: "glasses2", label: "Lunettes carrées" },
            { value: "glasses3", label: "Lunettes ovales" },
            { value: "glasses4", label: "Lunettes fines" },
            { value: "glasses5", label: "Lunettes larges" },
            { value: "sunglasses", label: "Lunettes de soleil" },
            { value: "sunglasses2", label: "Lunettes de soleil rondes" },
            { value: "eyepatch", label: "Cache-œil" },
          ]),
        },
        {
          optionKey: "mask",
          probabilityKey: "maskProbability",
          label: "Masque",
          type: "visuel",
          choices: avecAucun([
            { value: "medicalMask", label: "Masque chirurgical" },
            { value: "respirator", label: "Masque FFP2" },
          ]),
        },
      ],
    },
    {
      key: "fond",
      label: "Fond",
      controls: [{ optionKey: "backgroundColor", label: "Fond", type: "couleur", choices: FOND_CHOICES }],
    },
  ],

  // "Mini" (Mini Avatars) : petit personnage entier (tête + t-shirt), très
  // simple et coloré. Moustache optionnelle, désactivée par défaut.
  mini: [
    {
      key: "visage",
      label: "Visage",
      controls: [
        {
          optionKey: "head",
          label: "Forme du visage",
          type: "visuel",
          choices: [
            { value: "normal", label: "Normal" },
            { value: "wide", label: "Large" },
            { value: "thin", label: "Fin" },
          ],
        },
        {
          optionKey: "skinColor",
          label: "Couleur de peau",
          type: "couleur",
          choices: [
            { value: "ffe0bd", label: "Très claire" },
            { value: "ffcb7e", label: "Claire" },
            { value: "f5d0c5", label: "Rosée" },
            { value: "e8b58a", label: "Dorée" },
            { value: "c68642", label: "Bronze" },
            { value: "8d5524", label: "Brune" },
            { value: "5a3825", label: "Foncée" },
          ],
        },
        {
          optionKey: "blushes",
          probabilityKey: "blushesProbability",
          label: "Joues roses",
          type: "visuel",
          choices: avecAucun([{ value: "default", label: "Joues roses" }]),
        },
      ],
    },
    {
      key: "yeux",
      label: "Yeux",
      controls: [
        {
          optionKey: "eyes",
          label: "Regard",
          type: "visuel",
          choices: [
            { value: "normal", label: "Normal" },
            { value: "confident", label: "Confiant" },
            { value: "happy", label: "Joyeux" },
          ],
        },
        {
          optionKey: "mouth",
          label: "Bouche",
          type: "visuel",
          choices: [
            { value: "default", label: "Sourire" },
            { value: "missingTooth", label: "Dent manquante" },
          ],
        },
      ],
    },
    {
      key: "cheveux",
      label: "Coiffure",
      controls: [
        {
          optionKey: "hair",
          label: "Coiffure",
          type: "visuel",
          choices: [
            { value: "balndess", label: "Chauve" },
            { value: "slaughter", label: "Crête rebelle" },
            { value: "ponyTail", label: "Queue de cheval" },
            { value: "long", label: "Longs" },
            { value: "curly", label: "Bouclés" },
            { value: "stylish", label: "Stylé" },
            { value: "elvis", label: "Banane" },
            { value: "classic02", label: "Classique 1" },
            { value: "classic01", label: "Classique 2" },
          ],
        },
        {
          optionKey: "hairColor",
          label: "Couleur des cheveux",
          type: "couleur",
          choices: [
            { value: "47280b", label: "Brun" },
            { value: "1b0b47", label: "Violet" },
            { value: "ad3a20", label: "Roux" },
            { value: "2c2c2c", label: "Noir" },
            { value: "d4a017", label: "Blond doré" },
            { value: "1f6f8b", label: "Bleu" },
            { value: "2e8b57", label: "Vert" },
            { value: "e0218a", label: "Rose vif" },
          ],
        },
      ],
    },
    {
      key: "vetements",
      label: "Vêtements",
      controls: [
        {
          optionKey: "body",
          label: "Haut",
          type: "visuel",
          choices: [
            { value: "tShirt", label: "T-shirt" },
            { value: "golf", label: "Polo" },
          ],
        },
        {
          optionKey: "bodyColor",
          label: "Couleur du haut",
          type: "couleur",
          choices: [
            { value: "e05a33", label: "Orange" },
            { value: "3633e0", label: "Bleu" },
            { value: "ff4dd8", label: "Rose" },
            { value: "22c55e", label: "Vert" },
            { value: "facc15", label: "Jaune" },
            { value: "8b5cf6", label: "Violet" },
            { value: "06b6d4", label: "Cyan" },
            { value: "1f2937", label: "Noir" },
          ],
        },
      ],
    },
    {
      key: "accessoires",
      label: "Accessoires",
      controls: [
        {
          optionKey: "glasses",
          probabilityKey: "glassesProbability",
          label: "Lunettes",
          type: "visuel",
          choices: avecAucun([{ value: "normal", label: "Lunettes" }]),
        },
      ],
    },
    {
      key: "fond",
      label: "Fond",
      controls: [{ optionKey: "backgroundColor", label: "Fond", type: "couleur", choices: FOND_CHOICES }],
    },
  ],

  // "Perso" (Personas) : avatar buste + vêtements, coloré et stylé.
  personas: [
    {
      key: "visage",
      label: "Visage",
      controls: [
        {
          optionKey: "skinColor",
          label: "Couleur de peau",
          type: "couleur",
          choices: [
            { value: "eeb4a4", label: "Très claire" },
            { value: "e7a391", label: "Claire" },
            { value: "e5a07e", label: "Dorée" },
            { value: "d78774", label: "Bronze" },
            { value: "b16a5b", label: "Brun clair" },
            { value: "92594b", label: "Brune" },
            { value: "623d36", label: "Foncée" },
          ],
        },
        {
          optionKey: "body",
          label: "Silhouette",
          type: "visuel",
          choices: [
            { value: "squared", label: "Carrée" },
            { value: "rounded", label: "Ronde" },
            { value: "small", label: "Petite" },
            { value: "checkered", label: "À carreaux" },
          ],
        },
        {
          optionKey: "nose",
          label: "Nez",
          type: "visuel",
          choices: [
            { value: "mediumRound", label: "Nez moyen" },
            { value: "smallRound", label: "Petit nez" },
            { value: "wrinkles", label: "Nez marqué" },
          ],
        },
      ],
    },
    {
      key: "yeux",
      label: "Yeux",
      controls: [
        {
          optionKey: "eyes",
          label: "Yeux",
          type: "visuel",
          choices: [
            { value: "open", label: "Ouverts" },
            { value: "sleep", label: "Endormis" },
            { value: "wink", label: "Clin d'œil" },
            { value: "glasses", label: "Lunettes" },
            { value: "happy", label: "Joyeux" },
            { value: "sunglasses", label: "Lunettes de soleil" },
          ],
        },
      ],
    },
    {
      key: "bouche",
      label: "Bouche",
      controls: [
        {
          optionKey: "mouth",
          label: "Bouche",
          type: "visuel",
          choices: [
            { value: "smile", label: "Sourire" },
            { value: "frown", label: "Moue" },
            { value: "surprise", label: "Surprise" },
            { value: "pacifier", label: "Tétine" },
            { value: "bigSmile", label: "Grand sourire" },
            { value: "smirk", label: "Sourire en coin" },
            { value: "lips", label: "Lèvres" },
          ],
        },
      ],
    },
    {
      key: "cheveux",
      label: "Cheveux",
      controls: [
        {
          optionKey: "hair",
          label: "Coiffure",
          type: "visuel",
          choices: visuels("Coiffure", [
            "long",
            "sideShave",
            "shortCombover",
            "curlyHighTop",
            "bobCut",
            "curly",
            "pigtails",
            "buzzcut",
            "bald",
            "mohawk",
          ]),
        },
        {
          optionKey: "hairColor",
          label: "Couleur des cheveux",
          type: "couleur",
          choices: [
            { value: "362c47", label: "Brun foncé" },
            { value: "6c4545", label: "Brun roux" },
            { value: "e15c66", label: "Corail" },
            { value: "e16381", label: "Rose" },
            { value: "f27d65", label: "Pêche" },
            { value: "f29c65", label: "Abricot" },
            { value: "dee1f5", label: "Lavande" },
          ],
        },
      ],
    },
    {
      key: "accessoires",
      label: "Accessoires",
      controls: [
        {
          optionKey: "clothingColor",
          label: "Couleur des vêtements",
          type: "couleur",
          choices: [
            { value: "456dff", label: "Bleu" },
            { value: "54d7c7", label: "Turquoise" },
            { value: "7555ca", label: "Violet" },
            { value: "6dbb58", label: "Vert" },
            { value: "e24553", label: "Rouge" },
            { value: "f3b63a", label: "Jaune" },
            { value: "f55d81", label: "Rose" },
          ],
        },
      ],
    },
    {
      key: "fond",
      label: "Fond",
      controls: [{ optionKey: "backgroundColor", label: "Fond", type: "couleur", choices: FOND_CHOICES }],
    },
  ],
};

// ───────────────────────────────────────────────
//  Configuration par défaut / validation
// ───────────────────────────────────────────────

export function estStyleAvatar(valeur: unknown): valeur is AvatarStyleId {
  return typeof valeur === "string" && AVATAR_STYLES.some((s) => s.id === valeur);
}

function optionsParDefaut(style: AvatarStyleId): AvatarOptions {
  const options: AvatarOptions = {};
  for (const categorie of AVATAR_CATEGORIES[style]) {
    for (const control of categorie.controls) {
      if (control.probabilityKey) {
        // Par défaut, les parties optionnelles (lunettes, barbe, masque...)
        // sont désactivées : l'élève les active lui-même s'il le souhaite.
        options[control.optionKey] = AUCUN;
        continue;
      }
      const choixReel = control.choices.find((c) => c.value !== AUCUN);
      if (choixReel) options[control.optionKey] = choixReel.value;
    }
  }
  return options;
}

export function configAvatarParDefaut(style: AvatarStyleId): AvatarConfig {
  return { style, options: optionsParDefaut(style) };
}

function hashChaine(valeur: string): number {
  let h = 0;
  for (let i = 0; i < valeur.length; i++) {
    h = (h * 31 + valeur.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Config d'avatar d'un utilisateur : config sauvegardée, ou config par défaut dérivée de son id. */
export function configAvatarUtilisateur(user: {
  id: string;
  avatarStyle?: string | null;
  avatarOptions?: unknown;
}): AvatarConfig {
  if (
    estStyleAvatar(user.avatarStyle) &&
    user.avatarOptions &&
    typeof user.avatarOptions === "object" &&
    !Array.isArray(user.avatarOptions)
  ) {
    const options: AvatarOptions = {};
    for (const [cle, valeur] of Object.entries(user.avatarOptions as Record<string, unknown>)) {
      if (typeof valeur === "string") options[cle] = valeur;
    }
    return { style: user.avatarStyle, options };
  }

  const style = AVATAR_STYLES[hashChaine(user.id) % AVATAR_STYLES.length].id;
  return configAvatarParDefaut(style);
}

// ───────────────────────────────────────────────
//  Génération SVG (DiceBear)
// ───────────────────────────────────────────────

function optionsDicebear(config: AvatarConfig): Record<string, unknown> {
  const resultat: Record<string, unknown> = {};

  for (const categorie of AVATAR_CATEGORIES[config.style]) {
    for (const control of categorie.controls) {
      const valeur = config.options[control.optionKey];

      if (control.optionKey === "backgroundColor") {
        resultat.backgroundColor = [valeur || optionsParDefaut(config.style).backgroundColor];
        continue;
      }

      if (control.probabilityKey) {
        if (!valeur || valeur === AUCUN) {
          resultat[control.probabilityKey] = 0;
        } else {
          resultat[control.optionKey] = [valeur];
          resultat[control.probabilityKey] = 100;
        }
      } else if (valeur) {
        resultat[control.optionKey] = [valeur];
      }
    }
  }

  return resultat;
}

/**
 * Préfixe tous les id= et url(#...) d'un SVG avec un identifiant dérivé du seed.
 * Déterministe (même seed → même préfixe) : pas de mismatch SSR/client.
 * Évite les collisions de masques entre avatars d'utilisateurs différents.
 */
function prefixerIds(svg: string, seed: string): string {
  const prefix = seed.replace(/[^a-z0-9]/gi, "").slice(0, 10) || "av";
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${id}-${prefix}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}-${prefix})`);
}

/** Génère le SVG d'un avatar à partir de sa config (déterministe). */
export function genererAvatarSvg(config: AvatarConfig, seed: string, taille = 96): string {
  const style = STYLE_MODULES[config.style];
  const avatar = createAvatar(style, {
    seed,
    size: taille,
    radius: 50,
    backgroundType: ["solid"],
    ...optionsDicebear(config),
  });
  return prefixerIds(avatar.toString(), seed);
}

/** Avatar simple/neutre (côté prof, ou élève sans configuration personnalisée). */
export function genererAvatarNeutreSvg(seed: string, taille = 96): string {
  const avatar = createAvatar(botttsNeutral as unknown as Parameters<typeof createAvatar>[0], {
    seed,
    size: taille,
    radius: 50,
    backgroundType: ["solid"],
    backgroundColor: ["27314f"],
  });
  return prefixerIds(avatar.toString(), seed);
}

/** Aperçu d'un seul choix (utilisé par le constructeur pour les vignettes). */
export function genererApercuChoix(
  config: AvatarConfig,
  control: AvatarControl,
  valeurChoix: string,
  seed: string,
  taille = 64
): string {
  const optionsModifiees: AvatarConfig = {
    style: config.style,
    options: { ...config.options, [control.optionKey]: valeurChoix },
  };
  return genererAvatarSvg(optionsModifiees, seed, taille);
}
