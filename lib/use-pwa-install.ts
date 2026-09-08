"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
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
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    setIsIOS(detecterIOS());

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
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
