// Constructeur d'avatar façon Kahoot, basé sur DiceBear (libre de droits,
// composable). Les élèves choisissent un style puis personnalisent chaque
// partie (visage/peau, yeux, bouche, cheveux/casque, accessoires, fond).
// La config (style + options) est stockée en JSON dans User.avatarOptions.

import { createAvatar } from "@dicebear/core";
import * as bottts from "@dicebear/bottts";
import * as botttsNeutral from "@dicebear/bottts-neutral";
import * as adventurer from "@dicebear/adventurer";
import * as personas from "@dicebear/personas";

export type AvatarStyleId = "adventurer" | "bottts" | "personas";

export const AVATAR_STYLES: { id: AvatarStyleId; label: string; description: string }[] = [
  { id: "adventurer", label: "Aventurier", description: "Un personnage à customiser de la tête aux pieds" },
  { id: "bottts", label: "Robot", description: "Un robot bien futuriste" },
  { id: "personas", label: "Perso", description: "Un avatar coloré et stylé" },
];

const STYLE_MODULES: Record<AvatarStyleId, Parameters<typeof createAvatar>[0]> = {
  bottts: bottts as unknown as Parameters<typeof createAvatar>[0],
  adventurer: adventurer as unknown as Parameters<typeof createAvatar>[0],
  personas: personas as unknown as Parameters<typeof createAvatar>[0],
};

/** Valeur sentinelle « aucun » pour les parties optionnelles (lunettes, casque...). */
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
  bottts: [
    {
      key: "visage",
      label: "Visage",
      controls: [
        {
          optionKey: "face",
          label: "Forme",
          type: "visuel",
          choices: visuels("Forme", ["round01", "round02", "square01", "square02", "square03", "square04"]),
        },
        {
          optionKey: "baseColor",
          label: "Couleur",
          type: "couleur",
          choices: [
            { value: "1e88e5", label: "Bleu" },
            { value: "00acc1", label: "Cyan" },
            { value: "5e35b1", label: "Violet" },
            { value: "8e24aa", label: "Magenta" },
            { value: "43a047", label: "Vert" },
            { value: "fb8c00", label: "Orange" },
            { value: "d81b60", label: "Rose" },
            { value: "757575", label: "Gris" },
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
          choices: visuels("Yeux", ["bulging", "eva", "glow", "happy", "hearts", "robocop", "round", "sensor"]),
        },
      ],
    },
    {
      key: "bouche",
      label: "Bouche",
      controls: [
        {
          optionKey: "mouth",
          probabilityKey: "mouthProbability",
          label: "Bouche",
          type: "visuel",
          choices: avecAucun(visuels("Bouche", ["bite", "diagram", "grill01", "grill02", "smile01", "square01"])),
        },
      ],
    },
    {
      key: "cheveux",
      label: "Casque",
      controls: [
        {
          optionKey: "top",
          probabilityKey: "topProbability",
          label: "Casque",
          type: "visuel",
          choices: avecAucun(
            visuels("Casque", [
              "antenna",
              "antennaCrooked",
              "bulb01",
              "glowingBulb01",
              "glowingBulb02",
              "horns",
              "lights",
              "pyramid",
              "radar",
            ])
          ),
        },
      ],
    },
    {
      key: "accessoires",
      label: "Accessoires",
      controls: [
        {
          optionKey: "sides",
          probabilityKey: "sidesProbability",
          label: "Accessoire",
          type: "visuel",
          choices: avecAucun(
            visuels("Accessoire", ["antenna01", "antenna02", "cables01", "cables02", "round", "square", "squareAssymetric"])
          ),
        },
      ],
    },
    {
      key: "fond",
      label: "Fond",
      controls: [{ optionKey: "backgroundColor", label: "Fond", type: "couleur", choices: FOND_CHOICES }],
    },
  ],

  adventurer: [
    {
      key: "visage",
      label: "Peau",
      controls: [
        {
          optionKey: "skinColor",
          label: "Couleur de peau",
          type: "couleur",
          choices: [
            { value: "f2d3b1", label: "Claire" },
            { value: "ecad80", label: "Dorée" },
            { value: "9e5622", label: "Brune" },
            { value: "763900", label: "Foncée" },
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
          choices: visuels("Yeux", ["variant01", "variant04", "variant07", "variant10", "variant13", "variant16", "variant20", "variant24"]),
        },
        {
          optionKey: "eyebrows",
          label: "Sourcils",
          type: "visuel",
          choices: visuels("Sourcils", ["variant01", "variant03", "variant05", "variant07", "variant09", "variant12"]),
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
          choices: visuels("Bouche", ["variant02", "variant05", "variant08", "variant11", "variant14", "variant18", "variant22", "variant26"]),
        },
      ],
    },
    {
      key: "cheveux",
      label: "Cheveux",
      controls: [
        {
          optionKey: "hair",
          probabilityKey: "hairProbability",
          label: "Coiffure",
          type: "visuel",
          choices: avecAucun(
            visuels("Coiffure", ["short01", "short04", "short08", "short12", "short16", "long01", "long05", "long10", "long15", "long20"])
          ),
        },
        {
          optionKey: "hairColor",
          label: "Couleur des cheveux",
          type: "couleur",
          choices: [
            { value: "ac6511", label: "Auburn" },
            { value: "cb6820", label: "Roux" },
            { value: "ab2a18", label: "Rouge" },
            { value: "e5d7a3", label: "Blond" },
            { value: "0e0e0e", label: "Noir" },
            { value: "afafaf", label: "Gris" },
            { value: "3eac2c", label: "Vert" },
            { value: "592454", label: "Violet" },
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
          choices: avecAucun(visuels("Lunettes", ["variant01", "variant02", "variant03", "variant04", "variant05"])),
        },
        {
          optionKey: "features",
          probabilityKey: "featuresProbability",
          label: "Détail",
          type: "visuel",
          choices: [
            { value: AUCUN, label: "Aucun" },
            { value: "mustache", label: "Moustache" },
            { value: "blush", label: "Joues roses" },
            { value: "birthmark", label: "Grain de beauté" },
            { value: "freckles", label: "Taches de rousseur" },
          ],
        },
        {
          optionKey: "earrings",
          probabilityKey: "earringsProbability",
          label: "Boucle d'oreille",
          type: "visuel",
          choices: avecAucun(
            visuels("Boucle d'oreille", ["variant01", "variant02", "variant03", "variant04", "variant05", "variant06"])
          ),
        },
      ],
    },
    {
      key: "fond",
      label: "Fond",
      controls: [{ optionKey: "backgroundColor", label: "Fond", type: "couleur", choices: FOND_CHOICES }],
    },
  ],

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
          optionKey: "facialHair",
          probabilityKey: "facialHairProbability",
          label: "Barbe",
          type: "visuel",
          choices: [
            { value: AUCUN, label: "Aucune" },
            { value: "beardMustache", label: "Barbe complète" },
            { value: "pyramid", label: "Barbe pyramidale" },
            { value: "walrus", label: "Moustache" },
            { value: "goatee", label: "Bouc" },
            { value: "shadow", label: "Ombre" },
            { value: "soulPatch", label: "Mouche" },
          ],
        },
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
  return avatar.toString();
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
  return avatar.toString();
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
