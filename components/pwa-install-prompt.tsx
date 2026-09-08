"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { usePwaInstall } from "@/lib/use-pwa-install";

export function PWAInstallPrompt() {
  const { canInstallNative, isStandalone, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("pwa-install-dismissed")) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-install-dismissed", "1");
    setDismissed(true);
  };

  if (isStandalone || !canInstallNative || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border border-neon-cyan/30 bg-space-surface px-4 py-3 shadow-glow-cyan">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon-cyan/10 text-neon-cyan">
        <Download size={16} />
      </span>
      <p className="flex-1 text-sm font-medium text-ink-primary">
        Installer Nadtech sur votre appareil
      </p>
      <button
        onClick={promptInstall}
        className="rounded-lg bg-neon-cyan px-3 py-1.5 text-xs font-semibold text-space-bg transition-opacity hover:opacity-80"
      >
        Installer
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Fermer"
        className="shrink-0 text-ink-muted transition-colors hover:text-ink-primary"
      >
        <X size={16} />
      </button>
    </div>
  );
}
