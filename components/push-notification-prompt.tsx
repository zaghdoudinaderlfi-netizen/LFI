"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const CLE_STOCKAGE_MASQUE = "lfi-push-prompt-masque";

function urlBase64VersUint8Array(base64: string): Uint8Array {
  const complement = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Sur = (base64 + complement).replace(/-/g, "+").replace(/_/g, "/");
  const brut = window.atob(base64Sur);
  return Uint8Array.from([...brut].map((c) => c.charCodeAt(0)));
}

/**
 * Bandeau proposant d'activer les notifications push. N'apparaît que si le
 * navigateur les supporte, que la permission n'a pas déjà été tranchée par
 * l'utilisateur (accordée ou refusée) et qu'il ne l'a pas déjà masqué —
 * explique le "pourquoi" avant de déclencher le popup système, plutôt que
 * de le montrer à froid sans contexte.
 */
export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return;
    if (typeof Notification === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }
    if (Notification.permission !== "default") return;
    try {
      if (localStorage.getItem(CLE_STOCKAGE_MASQUE)) return;
    } catch {
      // localStorage indisponible (navigation privée) : le bandeau reste affiché,
      // simplement sans mémoriser un masquage éventuel.
    }
    setVisible(true);
  }, []);

  function masquer() {
    setVisible(false);
    try {
      localStorage.setItem(CLE_STOCKAGE_MASQUE, "1");
    } catch {
      // Sans conséquence : le bandeau pourra réapparaître à la prochaine visite.
    }
  }

  async function activer() {
    setEnCours(true);
    setErreur(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        masquer();
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const abonnement = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64VersUint8Array(VAPID_PUBLIC_KEY!) as BufferSource,
      });

      const reponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(abonnement.toJSON()),
      });
      if (!reponse.ok) throw new Error("Échec de l'enregistrement de l'abonnement.");

      setVisible(false);
    } catch {
      setErreur("Impossible d'activer les notifications pour le moment.");
    } finally {
      setEnCours(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-2xl border-2 border-space-border bg-space-surface p-4 shadow-2xl animate-fade-in-up sm:inset-x-auto sm:right-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neon-cyan/10 text-neon-cyan">
          <BellRing className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-medium text-ink-primary">Activer les notifications ?</p>
          <p className="mt-1 text-sm text-ink-secondary">
            Reçois une alerte directement sur ton téléphone dès qu&apos;un nouveau cours est publié,
            qu&apos;une note tombe ou qu&apos;une correction est disponible — même quand le site
            n&apos;est pas ouvert.
          </p>
          {erreur && <p className="mt-1 text-xs text-red-400">{erreur}</p>}
        </div>
        <button
          type="button"
          onClick={masquer}
          aria-label="Fermer"
          className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-space-surface2 hover:text-ink-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={masquer} className="btn-secondary">
          Plus tard
        </button>
        <button type="button" onClick={activer} disabled={enCours} className="btn-primary">
          {enCours ? "Activation…" : "Activer"}
        </button>
      </div>
    </div>
  );
}
