// Système d'avatar basé sur Avataaars (Pablo Stanley) via @dicebear/avataaars.
// Mêmes visuels que le package React "avataaars" original, compatible React 19.
// La config (style "avataaars" + options) est stockée en JSON dans User.avatarOptions.

import { createAvatar } from "@dicebear/core";
import * as avataaars from "@dicebear/avataaars";

export const AUCUN = "_aucun_";

export type AvatarStyleId = "avataaars";

export type AvatarOptions = Record<string, string>;

export type AvatarConfig = {
  style: AvatarStyleId;
  options: AvatarOptions;
};

export type AvatarChoice = {
  value: string;
  label: string;
  hex?: string; // couleur hexadécimale pour les swatches (sans le #)
};

export type AvatarControl = {
  optionKey: string;
  probabilityKey?: string; // non utilisé, conservé pour compatibilité actions.ts
  label: string;
  type: "visuel" | "couleur";
  choices: AvatarChoice[];
};

export type AvatarCategory = {
  key: string;
  label: string;
  controls: AvatarControl[];
};

// ── Génération SVG ─────────────────────────────────────────────────────────────

/**
 * Préfixe tous les id= et url(#...) avec un identifiant dérivé du seed.
 * Déterministe (même seed → même préfixe) : évite les collisions d'IDs dans le DOM
 * et ne cause pas de mismatch SSR/client.
 */
function prefixerIds(svg: string, seed: string): string {
  const prefix = seed.replace(/[^a-z0-9]/gi, "").slice(0, 10) || "av";
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${id}-${prefix}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}-${prefix})`);
}

function optionsDicebear(o: AvatarOptions): Record<string, unknown> {
  const hasAccessory = Boolean(o.accessories && o.accessories !== "");
  return {
    style: ["default"],          // "default" = sans cercle de fond
    top: [o.top || "shortCurly"],
    topProbability: 100,
    hairColor: [o.hairColor || "724133"],
    hatColor: [o.hatColor || "262e33"],
    accessories: hasAccessory ? [o.accessories] : [],
    accessoriesProbability: hasAccessory ? 100 : 0,
    clothing: [o.clothing || "hoodie"],
    clothesColor: [o.clothesColor || "b1e2ff"],
    clothingGraphic: [o.clothingGraphic || "bat"],
    eyes: [o.eyes || "default"],
    eyebrows: [o.eyebrows || "default"],
    mouth: [o.mouth || "smile"],
    skinColor: [o.skinColor || "edb98a"],
    facialHair: [],
    facialHairProbability: 0,
  };
}

/** Génère le SVG Avataaars à partir d'une config (déterministe). */
export function genererAvatarSvg(config: AvatarConfig, seed: string, taille = 96): string {
  const avatar = createAvatar(avataaars as Parameters<typeof createAvatar>[0], {
    seed,
    size: taille,
    radius: 50,
    backgroundType: ["solid"],
    backgroundColor: ["ffffff"],
    ...optionsDicebear(config.options),
  });
  return prefixerIds(avatar.toString(), seed);
}

/** SVG d'aperçu pour une vignette du constructeur (change une seule option). */
export function genererApercuChoix(
  config: AvatarConfig,
  control: AvatarControl,
  valeurChoix: string,
  seed: string,
  taille = 64
): string {
  const optionsModifiees = { ...config.options, [control.optionKey]: valeurChoix };
  return genererAvatarSvg({ ...config, options: optionsModifiees }, seed + control.optionKey + valeurChoix, taille);
}

// ── Config par défaut & utilitaires ──────────────────────────────────────────

const DEFAULT_OPTIONS: AvatarOptions = {
  top:             "shortCurly",
  hairColor:       "724133",
  hatColor:        "262e33",
  accessories:     "",
  clothing:        "hoodie",
  clothesColor:    "b1e2ff",
  clothingGraphic: "bat",
  eyes:            "default",
  eyebrows:        "default",
  mouth:           "smile",
  skinColor:       "edb98a",
};

export function configAvatarParDefaut(_style?: AvatarStyleId): AvatarConfig {
  return { style: "avataaars", options: { ...DEFAULT_OPTIONS } };
}

/** Config unique dérivée du seed (user.id) — pour les utilisateurs sans avatar personnalisé. */
export function configAvatarSeed(seed: string): AvatarConfig {
  const h = (salt: number) =>
    [...seed].reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + salt + 1), 0);
  const pick = (arr: string[], salt: number) => arr[Math.abs(h(salt)) % arr.length];

  return {
    style: "avataaars",
    options: {
      top:             pick(TOP_VALUES, 1),
      hairColor:       pick(HAIR_COLORS, 2),
      hatColor:        pick(COLOR_VALUES, 3),
      accessories:     "",
      clothing:        pick(CLOTHING_VALUES, 5),
      clothesColor:    pick(COLOR_VALUES, 6),
      clothingGraphic: pick(GRAPHIC_VALUES, 7),
      eyes:            pick(EYE_VALUES, 8),
      eyebrows:        pick(EYEBROW_VALUES, 9),
      mouth:           pick(MOUTH_VALUES, 10),
      skinColor:       pick(SKIN_COLORS, 11),
    },
  };
}

export function estStyleAvatar(v: unknown): v is AvatarStyleId {
  return v === "avataaars";
}

export function configAvatarUtilisateur(user: {
  avatarStyle?: string | null;
  avatarOptions?: unknown;
  id?: string;
}): AvatarConfig {
  if (
    user.avatarStyle === "avataaars" &&
    typeof user.avatarOptions === "object" &&
    user.avatarOptions !== null
  ) {
    return { style: "avataaars", options: user.avatarOptions as AvatarOptions };
  }
  if (user.id) return configAvatarSeed(user.id);
  return configAvatarParDefaut();
}

// ── Style unique ──────────────────────────────────────────────────────────────

export const AVATAR_STYLES: { id: AvatarStyleId; label: string; description: string }[] = [
  { id: "avataaars", label: "Cartoon", description: "Personnage cartoon personnalisable" },
];

// ── Valeurs d'options ─────────────────────────────────────────────────────────

const TOP_VALUES = [
  "shortCurly", "shortFlat", "shortRound", "shortWaved", "theCaesar",
  "theCaesarAndSidePart", "sides", "frizzle", "shaggy", "shaggyMullet",
  "dreads01", "dreads02", "straight01", "straight02", "straightAndStrand",
  "bigHair", "bob", "bun", "curly", "curvy", "miaWallace", "longButNotTooLong",
  "shavedSides", "frida", "fro", "froBand", "dreads",
  "hat", "winterHat1", "winterHat02", "winterHat03", "winterHat04",
];

const HAIR_COLORS = [
  "a55728", "2c1b18", "b58143", "d6b370",
  "724133", "4a312c", "f59797", "ecdcbf", "c93305", "e8e1e1",
];

const COLOR_VALUES = [
  "262e33", "65c9ff", "5199e4", "25557c", "e6e6e6", "929598", "3c4f5c",
  "b1e2ff", "a7ffc4", "ffdeb5", "ffafb9", "ffffb1", "ff488e", "ff5c5c", "ffffff",
];

const SKIN_COLORS = ["614335", "d08b5b", "ae5d29", "edb98a", "ffdbb4", "fd9841", "f8d25c"];

const CLOTHING_VALUES = [
  "blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt",
  "hoodie", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck",
];

const GRAPHIC_VALUES = [
  "bat", "bear", "cumbia", "deer", "diamond", "hola", "pizza", "resist",
  "skull", "skullOutline",
];

const EYE_VALUES = [
  "closed", "cry", "default", "eyeRoll", "happy", "hearts",
  "side", "squint", "surprised", "winkWacky", "wink", "xDizzy",
];

const EYEBROW_VALUES = [
  "angryNatural", "defaultNatural", "flatNatural", "frownNatural",
  "raisedExcitedNatural", "sadConcernedNatural", "unibrowNatural", "upDownNatural",
  "angry", "default", "raisedExcited", "sadConcerned", "upDown",
];

const MOUTH_VALUES = [
  "concerned", "default", "disbelief", "eating", "grimace", "sad",
  "screamOpen", "serious", "smile", "tongue", "twinkle", "vomit",
];

// ── Palettes avec libellés (pour le constructeur) ─────────────────────────────

function swatch(hex: string, label: string): AvatarChoice {
  return { value: hex, label, hex };
}

// ── Catégories du constructeur ────────────────────────────────────────────────

export const AVATAR_CATEGORIES: Record<AvatarStyleId, AvatarCategory[]> = {
  avataaars: [
    {
      key: "peau",
      label: "Peau",
      controls: [
        {
          optionKey: "skinColor",
          label: "Couleur de peau",
          type: "couleur",
          choices: [
            swatch("ffdbb4", "Très claire"),
            swatch("edb98a", "Claire"),
            swatch("fd9841", "Dorée"),
            swatch("f8d25c", "Cartoon"),
            swatch("d08b5b", "Brune"),
            swatch("ae5d29", "Foncée"),
            swatch("614335", "Très foncée"),
          ],
        },
      ],
    },
    {
      key: "coiffure",
      label: "Coiffure",
      controls: [
        {
          optionKey: "top",
          label: "Style de coiffure",
          type: "visuel",
          choices: [
            // Cheveux courts
            { value: "shortCurly",           label: "Court bouclé" },
            { value: "shortFlat",             label: "Court plat" },
            { value: "shortRound",            label: "Court rond" },
            { value: "shortWaved",            label: "Court ondulé" },
            { value: "theCaesar",             label: "César" },
            { value: "theCaesarAndSidePart",  label: "César côté" },
            { value: "sides",                 label: "Dégradé" },
            { value: "frizzle",               label: "Frisé court" },
            { value: "shaggy",                label: "Shaggy" },
            { value: "shaggyMullet",          label: "Shaggy mullet" },
            { value: "dreads01",              label: "Dreads courts" },
            { value: "dreads02",              label: "Dreads tressés" },
            // Cheveux longs
            { value: "straight01",            label: "Long lisse" },
            { value: "straight02",            label: "Long lisse 2" },
            { value: "straightAndStrand",     label: "Long + mèche" },
            { value: "bigHair",               label: "Long volumineux" },
            { value: "bob",                   label: "Bob" },
            { value: "bun",                   label: "Chignon" },
            { value: "curly",                 label: "Long bouclé" },
            { value: "curvy",                 label: "Long ondulé" },
            { value: "miaWallace",            label: "Mi-long lisse" },
            { value: "longButNotTooLong",     label: "Pas trop long" },
            { value: "shavedSides",           label: "Rasé sur côtés" },
            { value: "frida",                 label: "Frida" },
            { value: "fro",                   label: "Afro" },
            { value: "froBand",               label: "Afro + bandeau" },
            { value: "dreads",                label: "Dreads longs" },
            // Chapeaux (hijab et turban exclus — neutralité)
            { value: "hat",                   label: "Casquette" },
            { value: "winterHat1",            label: "Bonnet 1" },
            { value: "winterHat02",           label: "Bonnet 2" },
            { value: "winterHat03",           label: "Bonnet 3" },
            { value: "winterHat04",           label: "Bonnet 4" },
          ],
        },
        {
          optionKey: "hairColor",
          label: "Couleur des cheveux",
          type: "couleur",
          choices: [
            swatch("a55728", "Auburn"),
            swatch("2c1b18", "Noir"),
            swatch("b58143", "Blond clair"),
            swatch("d6b370", "Blond doré"),
            swatch("724133", "Brun"),
            swatch("4a312c", "Brun foncé"),
            swatch("f59797", "Rose pastel"),
            swatch("ecdcbf", "Platine"),
            swatch("c93305", "Roux"),
            swatch("e8e1e1", "Gris argenté"),
          ],
        },
        {
          optionKey: "hatColor",
          label: "Couleur du chapeau",
          type: "couleur",
          choices: [
            swatch("262e33", "Noir"),       swatch("65c9ff", "Bleu clair"),
            swatch("5199e4", "Bleu"),       swatch("25557c", "Bleu foncé"),
            swatch("e6e6e6", "Gris clair"), swatch("929598", "Gris"),
            swatch("3c4f5c", "Chiné"),      swatch("b1e2ff", "Bleu pastel"),
            swatch("a7ffc4", "Vert pastel"),swatch("ffdeb5", "Orange pastel"),
            swatch("ffafb9", "Rose pastel"),swatch("ffffb1", "Jaune pastel"),
            swatch("ff488e", "Rose"),       swatch("ff5c5c", "Rouge"),
            swatch("ffffff", "Blanc"),
          ],
        },
      ],
    },
    {
      key: "visage",
      label: "Visage",
      controls: [
        {
          optionKey: "eyes",
          label: "Yeux",
          type: "visuel",
          choices: [
            { value: "default",   label: "Normal" },
            { value: "happy",     label: "Heureux" },
            { value: "wink",      label: "Clin d'œil" },
            { value: "surprised", label: "Surpris" },
            { value: "squint",    label: "Plissés" },
            { value: "side",      label: "Côté" },
            { value: "hearts",    label: "Cœurs" },
            { value: "xDizzy",    label: "Étourdi" },
            { value: "eyeRoll",   label: "Roulés" },
            { value: "closed",    label: "Fermés" },
            { value: "cry",       label: "Pleurant" },
            { value: "winkWacky", label: "Clin loufoque" },
          ],
        },
        {
          optionKey: "eyebrows",
          label: "Sourcils",
          type: "visuel",
          choices: [
            { value: "default",                label: "Normal" },
            { value: "defaultNatural",         label: "Naturel" },
            { value: "raisedExcited",          label: "Relevés" },
            { value: "raisedExcitedNatural",   label: "Relevés nat." },
            { value: "flatNatural",            label: "Plats" },
            { value: "frownNatural",           label: "Froncés" },
            { value: "angryNatural",           label: "En colère nat." },
            { value: "angry",                  label: "En colère" },
            { value: "sadConcerned",           label: "Inquiets" },
            { value: "sadConcernedNatural",    label: "Inquiets nat." },
            { value: "unibrowNatural",         label: "Monobrow" },
            { value: "upDown",                 label: "Haut-bas" },
            { value: "upDownNatural",          label: "Haut-bas nat." },
          ],
        },
        {
          optionKey: "mouth",
          label: "Bouche",
          type: "visuel",
          choices: [
            { value: "smile",      label: "Sourire" },
            { value: "default",    label: "Normal" },
            { value: "twinkle",    label: "Pétillant" },
            { value: "tongue",     label: "Langue" },
            { value: "eating",     label: "Qui mange" },
            { value: "grimace",    label: "Grimace" },
            { value: "serious",    label: "Sérieux" },
            { value: "sad",        label: "Triste" },
            { value: "concerned",  label: "Inquiet" },
            { value: "disbelief",  label: "Incrédule" },
            { value: "screamOpen", label: "Cri" },
            { value: "vomit",      label: "Malade" },
          ],
        },
      ],
    },
    {
      key: "vetements",
      label: "Vêtements",
      controls: [
        {
          optionKey: "clothing",
          label: "Style de vêtement",
          type: "visuel",
          choices: [
            { value: "blazerAndShirt",   label: "Blazer + chemise" },
            { value: "blazerAndSweater", label: "Blazer + pull" },
            { value: "collarAndSweater", label: "Pull col" },
            { value: "graphicShirt",     label: "T-shirt graphique" },
            { value: "hoodie",           label: "Sweat à capuche" },
            { value: "overall",          label: "Salopette" },
            { value: "shirtCrewNeck",    label: "T-shirt col rond" },
            { value: "shirtScoopNeck",   label: "T-shirt col plongé" },
            { value: "shirtVNeck",       label: "T-shirt col V" },
          ],
        },
        {
          optionKey: "clothesColor",
          label: "Couleur du vêtement",
          type: "couleur",
          choices: [
            swatch("262e33", "Noir"),       swatch("65c9ff", "Bleu clair"),
            swatch("5199e4", "Bleu"),       swatch("25557c", "Bleu foncé"),
            swatch("e6e6e6", "Gris clair"), swatch("929598", "Gris"),
            swatch("3c4f5c", "Chiné"),      swatch("b1e2ff", "Bleu pastel"),
            swatch("a7ffc4", "Vert pastel"),swatch("ffdeb5", "Orange pastel"),
            swatch("ffafb9", "Rose pastel"),swatch("ffffb1", "Jaune pastel"),
            swatch("ff488e", "Rose"),       swatch("ff5c5c", "Rouge"),
            swatch("ffffff", "Blanc"),
          ],
        },
        {
          optionKey: "clothingGraphic",
          label: "Motif (T-shirt graphique)",
          type: "visuel",
          choices: [
            { value: "bat",         label: "Chauve-souris" },
            { value: "cumbia",      label: "Musique" },
            { value: "deer",        label: "Cerf" },
            { value: "diamond",     label: "Diamant" },
            { value: "hola",        label: "Hola" },
            { value: "pizza",       label: "Pizza" },
            { value: "resist",      label: "Resist" },
            { value: "bear",        label: "Ours" },
            { value: "skullOutline",label: "Tête de mort" },
            { value: "skull",       label: "Crâne" },
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
          label: "Lunettes",
          type: "visuel",
          choices: [
            { value: "",              label: "Aucune" },
            { value: "kurt",          label: "Rondes" },
            { value: "prescription01",label: "Classiques" },
            { value: "prescription02",label: "Fines" },
            { value: "round",         label: "Cercles" },
            { value: "sunglasses",    label: "Soleil" },
            { value: "wayfarers",     label: "Carrées" },
          ],
        },
      ],
    },
  ],
};
