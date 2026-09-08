"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
    __pwaInstalled?: boolean;
  }
}

/**
 * Détecte iOS/iPadOS. Depuis iOS 13, l'iPad s'annonce comme "MacIntel" dans
 * navigator.platform : on le distingue d'un vrai Mac par le support tactile.
 */
function detecterIOS(): boolean {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !("MSStream" in window)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/**
 * État partagé de l'installabilité PWA, utilisé par le bouton d'installation
 * présent dans les différents en-têtes du site (landing + espaces élève/prof).
 *
 * "beforeinstallprompt" ne se déclenche qu'une fois, tôt — potentiellement
 * avant que ce hook (dans un composant client hydraté après un aller-retour
 * serveur) ne soit monté. Un script inline dans <head> (voir app/layout.tsx)
 * le capture donc en amont sur `window` ; ce hook lit cette valeur au
 * montage (au cas où déjà capturée) puis écoute les mises à jour futures.
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches || window.__pwaInstalled === true
    );
    setIsIOS(detecterIOS());

    if (window.__pwaDeferredPrompt) {
      setDeferredPrompt(window.__pwaDeferredPrompt);
    }

    const onReady = () => {
      if (window.__pwaDeferredPrompt) setDeferredPrompt(window.__pwaDeferredPrompt);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("__pwaDeferredPromptReady", onReady);
    window.addEventListener("__pwaInstalledEvent", onInstalled);
    return () => {
      window.removeEventListener("__pwaDeferredPromptReady", onReady);
      window.removeEventListener("__pwaInstalledEvent", onInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    window.__pwaDeferredPrompt = null;
    if (outcome === "accepted") setIsStandalone(true);
    setDeferredPrompt(null);
  }

  return {
    /** true si l'invite native (Android/Chrome/Edge) a été capturée. */
    canInstallNative: deferredPrompt !== null,
    isIOS,
    isStandalone,
    promptInstall,
  };
}
