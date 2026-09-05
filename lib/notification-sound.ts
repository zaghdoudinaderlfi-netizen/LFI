// Sons de notification synthétisés (Web Audio) — pas de fichier audio à
// charger. N'a d'effet que côté navigateur ; ne rien faire côté serveur ou
// si l'API est indisponible (anciens navigateurs).

let contexteAudio: AudioContext | null = null;

function obtenirContexte(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!contexteAudio) {
    contexteAudio = new AudioCtx();
  }
  if (contexteAudio.state === "suspended") {
    contexteAudio.resume().catch(() => {});
  }
  return contexteAudio;
}

function jouerTonalite(frequence: number, debutSec: number, dureeSec: number, contexte: AudioContext) {
  const oscillateur = contexte.createOscillator();
  const gain = contexte.createGain();
  const t0 = contexte.currentTime + debutSec;

  oscillateur.type = "sine";
  oscillateur.frequency.value = frequence;

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.18, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dureeSec);

  oscillateur.connect(gain);
  gain.connect(contexte.destination);
  oscillateur.start(t0);
  oscillateur.stop(t0 + dureeSec + 0.02);
}

/** Notification générale — un seul ton bref et neutre. */
export function jouerSonGeneral() {
  const contexte = obtenirContexte();
  if (!contexte) return;
  jouerTonalite(880, 0, 0.22, contexte);
}

/** Nouvelle note reçue — carillon ascendant à deux notes, plus marquant. */
export function jouerSonNote() {
  const contexte = obtenirContexte();
  if (!contexte) return;
  jouerTonalite(1046.5, 0, 0.16, contexte); // Do6
  jouerTonalite(1318.5, 0.09, 0.28, contexte); // Mi6
}
