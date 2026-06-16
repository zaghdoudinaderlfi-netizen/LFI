"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AUCUN,
  AVATAR_CATEGORIES,
  AVATAR_STYLES,
  configAvatarParDefaut,
  genererApercuChoix,
  genererAvatarSvg,
  type AvatarConfig,
  type AvatarControl,
  type AvatarStyleId,
} from "@/lib/avatar";
import { enregistrerAvatarAction } from "@/app/eleve/profil/actions";
import { useToast } from "@/components/ui/toast";

/** Constructeur d'avatar Avataaars : aperçu en direct + personnalisation complète. */
export function AvatarBuilder({
  seed,
  configInitiale,
}: {
  seed: string;
  configInitiale: AvatarConfig;
}) {
  const [config, setConfig] = useState<AvatarConfig>(configInitiale);
  const categories = AVATAR_CATEGORIES[config.style];
  const [categorieActive, setCategorieActive] = useState(categories[0].key);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const categorie = categories.find((c) => c.key === categorieActive) ?? categories[0];
  const previewSvg = useMemo(() => genererAvatarSvg(config, seed, 160), [config, seed]);

  function changerStyle(style: AvatarStyleId) {
    const cats = AVATAR_CATEGORIES.avataaars;
    setConfig(configAvatarParDefaut(style));
    setCategorieActive(cats[0].key);
  }

  function choisir(control: AvatarControl, valeur: string) {
    setConfig((c) => ({ ...c, options: { ...c.options, [control.optionKey]: valeur } }));
  }

  function aleatoire() {
    const nouvellesOptions = { ...config.options };
    for (const cat of categories) {
      for (const control of cat.controls) {
        const choix = control.choices[Math.floor(Math.random() * control.choices.length)];
        nouvellesOptions[control.optionKey] = choix.value;
      }
    }
    setConfig((c) => ({ ...c, options: nouvellesOptions }));
  }

  function enregistrer() {
    startTransition(async () => {
      const resultat = await enregistrerAvatarAction(config.style, config.options);
      if (resultat === "ok") {
        addToast({ type: "success", message: "Ton avatar a été enregistré !" });
      } else {
        addToast({ type: "error", message: resultat });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
      {/* Aperçu */}
      <div className="flex flex-col items-center gap-4 sm:w-52 sm:shrink-0">
        <div
          key={previewSvg}
          className="avatar-frame h-44 w-44 overflow-hidden rounded-full shadow-glow-cyan ring-2 ring-neon-cyan/40 animate-pop-in"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />

        {AVATAR_STYLES.length > 1 && (
          <div className="flex w-full flex-col gap-2">
            {AVATAR_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => changerStyle(s.id)}
                aria-pressed={config.style === s.id}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  config.style === s.id
                    ? "border-neon-cyan/60 bg-space-surface2 text-neon-cyan"
                    : "border-space-border text-ink-secondary hover:border-neon-cyan/30 hover:text-ink-primary"
                }`}
              >
                <span className="block text-sm font-medium">{s.label}</span>
                <span className="block text-xs text-ink-muted">{s.description}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex w-full gap-2">
          <button type="button" onClick={aleatoire} className="btn-secondary flex-1">
            🎲 Aléatoire
          </button>
        </div>

        <button
          type="button"
          onClick={enregistrer}
          disabled={isPending}
          className="btn-primary w-full"
        >
          {isPending ? "Enregistrement..." : "Enregistrer mon avatar"}
        </button>
      </div>

      {/* Catégories */}
      <div className="min-w-0 flex-1">
        <div role="tablist" aria-label="Catégories d'avatar" className="mb-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={categorie.key === cat.key}
              onClick={() => setCategorieActive(cat.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                categorie.key === cat.key
                  ? "bg-gradient-to-r from-neon-blue to-neon-violet text-accent-fg"
                  : "border border-space-border text-ink-secondary hover:border-neon-cyan/40 hover:text-ink-primary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          {categorie.controls.map((control) => (
            <ControleAvatar
              key={control.optionKey}
              config={config}
              control={control}
              seed={seed}
              onChoisir={(v) => choisir(control, v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ControleAvatar({
  config,
  control,
  seed,
  onChoisir,
}: {
  config: AvatarConfig;
  control: AvatarControl;
  seed: string;
  onChoisir: (valeur: string) => void;
}) {
  const valeurActuelle = config.options[control.optionKey] ?? "";

  return (
    <fieldset>
      <legend className="field-label mb-2">{control.label}</legend>
      <div className="flex flex-wrap gap-2">
        {control.choices.map((choix) => {
          const selectionne = valeurActuelle === choix.value;

          if (control.type === "couleur") {
            return (
              <button
                key={choix.value}
                type="button"
                title={choix.label}
                aria-label={choix.label}
                aria-pressed={selectionne}
                onClick={() => onChoisir(choix.value)}
                className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
                  selectionne ? "border-neon-cyan shadow-glow-cyan scale-110" : "border-space-border"
                }`}
                style={{ backgroundColor: choix.hex ? `#${choix.hex}` : "#888" }}
              />
            );
          }

          // Vignette visuelle
          const apercuSvg = choix.value === AUCUN || choix.value === ""
            ? null
            : genererApercuChoix(config, control, choix.value, seed, 56);

          return (
            <button
              key={choix.value}
              type="button"
              title={choix.label}
              aria-label={choix.label}
              aria-pressed={selectionne}
              onClick={() => onChoisir(choix.value)}
              className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 transition-transform hover:scale-110 ${
                selectionne ? "border-neon-cyan shadow-glow-cyan scale-110" : "border-space-border bg-space-surface2"
              }`}
            >
              {apercuSvg ? (
                <span
                  className="h-full w-full"
                  dangerouslySetInnerHTML={{ __html: apercuSvg }}
                />
              ) : (
                <span className="text-[10px] font-medium text-ink-muted">Aucune</span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
