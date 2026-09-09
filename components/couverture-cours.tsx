import type { Matiere } from "@prisma/client";

/**
 * Couverture décorative générée pour un cours sans image téléversée.
 *
 * Jusqu'ici, un cours sans photo affichait un dégradé terne et une petite
 * icône grise — identique pour tous les cours. En 3ème, la vignette est ce
 * qui donne envie d'ouvrir le cours : la TECHNOLOGIE reçoit donc une
 * couverture colorée avec un motif (engrenages, circuit, briques, fusée),
 * tandis que SNT et NSI, au lycée, gardent un rendu sobre.
 *
 * Le rendu est déterministe : la même graine (l'id du cours) donne toujours
 * la même couverture, donc l'élève retrouve ses repères d'une visite à
 * l'autre. Tout est en SVG en ligne — aucun fichier à téléverser ni à
 * charger.
 */

type Palette = { de: string; vers: string; accent: string };

// Palettes vives réservées au collège. Contrastées entre elles pour que deux
// cours voisins d'un même chapitre ne se ressemblent pas.
const PALETTES_TECHNO: Palette[] = [
  { de: "#f97316", vers: "#db2777", accent: "#fde68a" }, // orange → rose
  { de: "#06b6d4", vers: "#4f46e5", accent: "#a5f3fc" }, // cyan → indigo
  { de: "#22c55e", vers: "#0d9488", accent: "#bbf7d0" }, // vert → teal
  { de: "#8b5cf6", vers: "#d946ef", accent: "#e9d5ff" }, // violet → fuchsia
  { de: "#f59e0b", vers: "#ea580c", accent: "#fef3c7" }, // ambre → orange
];

// Lycée : deux bleus sombres proches de l'habillage de l'app.
const PALETTE_LYCEE: Palette = { de: "#1e293b", vers: "#312e81", accent: "#7dd3fc" };

/** Hachage stable (djb2) — même graine, même couverture à chaque rendu. */
function hacher(graine: string): number {
  let h = 5381;
  for (let i = 0; i < graine.length; i++) h = ((h << 5) + h + graine.charCodeAt(i)) >>> 0;
  return h;
}

/** Engrenages — la mécanique. */
function MotifEngrenages({ accent }: { accent: string }) {
  return (
    <g fill={accent} opacity="0.9">
      <path d="M96 46a50 50 0 0 1 12 0l4-13h16l4 13a50 50 0 0 1 10 6l13-6 11 11-6 13a50 50 0 0 1 6 10l13 4v16l-13 4a50 50 0 0 1-6 10l6 13-11 11-13-6a50 50 0 0 1-10 6l-4 13h-16l-4-13a50 50 0 0 1-10-6l-13 6-11-11 6-13a50 50 0 0 1-6-10l-13-4v-16l13-4a50 50 0 0 1 6-10l-6-13 11-11 13 6a50 50 0 0 1 8-6z" />
      <circle cx="112" cy="102" r="20" fill="#0b1020" opacity="0.55" />
    </g>
  );
}

/** Circuit imprimé — l'électronique. */
function MotifCircuit({ accent }: { accent: string }) {
  return (
    <g stroke={accent} strokeWidth="5" fill="none" opacity="0.9" strokeLinecap="round">
      <path d="M30 60h40l20 20h50" />
      <path d="M30 120h30l25-25" />
      <path d="M150 120h30" />
      <path d="M110 150v-30l30-30h40" />
      <g fill={accent} stroke="none">
        <circle cx="150" cy="80" r="9" />
        <circle cx="180" cy="120" r="9" />
        <circle cx="110" cy="150" r="9" />
        <circle cx="60" cy="120" r="9" />
        <rect x="26" y="52" width="16" height="16" rx="3" />
      </g>
    </g>
  );
}

/** Briques empilées — la construction, l'objet technique. */
function MotifBriques({ accent }: { accent: string }) {
  return (
    <g fill={accent} opacity="0.9">
      <rect x="40" y="118" width="54" height="34" rx="6" />
      <rect x="102" y="118" width="54" height="34" rx="6" opacity="0.75" />
      <rect x="71" y="78" width="54" height="34" rx="6" opacity="0.85" />
      <rect x="133" y="78" width="42" height="34" rx="6" opacity="0.6" />
      <rect x="102" y="38" width="54" height="34" rx="6" opacity="0.7" />
    </g>
  );
}

/** Fusée — le projet, l'énergie. */
function MotifFusee({ accent }: { accent: string }) {
  return (
    <g opacity="0.9">
      <path
        d="M110 30c22 18 34 44 34 72l-14 16h-40l-14-16c0-28 12-54 34-72z"
        fill={accent}
      />
      <circle cx="110" cy="82" r="13" fill="#0b1020" opacity="0.55" />
      <path d="M96 118l-22 22 4-34zM124 118l22 22-4-34z" fill={accent} opacity="0.65" />
      <path d="M104 134h12l-6 26z" fill="#fff" opacity="0.55" />
    </g>
  );
}

const MOTIFS_TECHNO = [MotifEngrenages, MotifCircuit, MotifBriques, MotifFusee];

/** Lycée : un simple chevron de code, discret. */
function MotifCode({ accent }: { accent: string }) {
  return (
    <g stroke={accent} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
      <path d="M80 70L48 102l32 32" />
      <path d="M140 70l32 32-32 32" />
      <path d="M118 62l-16 80" strokeWidth="6" />
    </g>
  );
}

export function CouvertureCours({
  matiere,
  graine,
  className = "",
}: {
  matiere: Matiere;
  /** Id ou slug du cours : fixe la palette et le motif. */
  graine: string;
  className?: string;
}) {
  const h = hacher(graine);
  const ludique = matiere === "TECHNOLOGIE";

  const palette = ludique ? PALETTES_TECHNO[h % PALETTES_TECHNO.length] : PALETTE_LYCEE;
  // `>>>` et non `>>` : le décalage signé rend l'index négatif dès que le
  // hachage dépasse 2^31, et le motif ressort `undefined`.
  const Motif = ludique ? MOTIFS_TECHNO[(h >>> 3) % MOTIFS_TECHNO.length] : MotifCode;

  // L'id doit distinguer deux couvertures VISUELLEMENT différentes présentes
  // sur la même page : à ids égaux, le navigateur résout `url(#…)` sur le
  // premier dégradé rencontré, et la seconde couverture emprunte les couleurs
  // de la première. La matière entre donc dans l'id, puisqu'une même graine y
  // donne deux palettes.
  const idDegrade = `couv-${matiere}-${h.toString(36)}`;

  return (
    <svg
      viewBox="0 0 220 180"
      preserveAspectRatio="xMidYMid slice"
      className={`h-full w-full ${className}`}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={idDegrade} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.de} />
          <stop offset="100%" stopColor={palette.vers} />
        </linearGradient>
      </defs>

      <rect width="220" height="180" fill={`url(#${idDegrade})`} />

      {/* Halos qui donnent du relief au fond */}
      <circle cx="30" cy="20" r="60" fill="#fff" opacity={ludique ? 0.12 : 0.06} />
      <circle cx="200" cy="165" r="70" fill="#000" opacity="0.12" />

      <Motif accent={palette.accent} />

      {/* Confettis : réservés au collège */}
      {ludique && (
        <g fill="#fff" opacity="0.5">
          <circle cx="188" cy="34" r="5" />
          <circle cx="34" cy="150" r="4" />
          <circle cx="168" cy="62" r="3" />
          <rect x="18" y="92" width="8" height="8" rx="2" transform="rotate(20 22 96)" />
        </g>
      )}
    </svg>
  );
}
