"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { Matiere } from "@prisma/client";

const ONGLETS: { value: Matiere; label: string; activeClass: string }[] = [
  { value: "TECHNOLOGIE", label: "Technologie", activeClass: "tab-arcade-active-techno" },
  { value: "SNT",         label: "SNT",          activeClass: "tab-arcade-active-snt" },
  { value: "NSI",         label: "NSI",          activeClass: "tab-arcade-active-nsi" },
];

export function MatiereTabs({
  matiereActive,
  basePath,
  storageKey,
  avecToutes = false,
}: {
  matiereActive: Matiere | null;
  basePath: string;
  storageKey: string;
  avecToutes?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams.get("matiere")) {
      const saved = localStorage.getItem(storageKey) as Matiere | null;
      if (saved && ONGLETS.some((o) => o.value === saved)) {
        router.replace(`${basePath}?matiere=${saved}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choisir(matiere: Matiere) {
    localStorage.setItem(storageKey, matiere);
    router.push(`${basePath}?matiere=${matiere}`);
  }

  function choisirToutes() {
    localStorage.removeItem(storageKey);
    router.push(basePath);
  }

  return (
    <div className="flex gap-1 rounded-xl border-2 border-space-border bg-space-surface2/60 p-1 animate-fade-in-up">
      {avecToutes && (
        <button
          type="button"
          onClick={choisirToutes}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            matiereActive === null ? "tab-arcade-active-toutes" : "tab-arcade-inactive"
          }`}
        >
          Toutes
        </button>
      )}
      {ONGLETS.map(({ value, label, activeClass }) => {
        const actif = matiereActive === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => choisir(value)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              actif ? activeClass : "tab-arcade-inactive"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
