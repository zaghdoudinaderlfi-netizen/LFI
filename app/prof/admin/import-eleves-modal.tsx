"use client";

import { useState } from "react";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { AlertTriangle, CheckCircle2, Download, X } from "lucide-react";
import {
  analyserLignesImport,
  type LigneAvecIdentifiant,
  type ResultatApercuImport,
  type ResultatCreationEleve,
} from "@/lib/import-eleves";
import { preparerIdentifiantsAction, confirmerImportEleveAction } from "./import-actions";

async function lireLignesFichier(fichier: File): Promise<string[][]> {
  const extension = fichier.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return new Promise((resolve, reject) => {
      Papa.parse<string[]>(fichier, {
        skipEmptyLines: true,
        complete: (resultat) => resolve(resultat.data),
        error: (erreur: Error) => reject(erreur),
      });
    });
  }

  if (extension === "xlsx" || extension === "xls") {
    const classeur = new ExcelJS.Workbook();
    await classeur.xlsx.load(await fichier.arrayBuffer());
    const feuille = classeur.worksheets[0];
    if (!feuille) throw new Error("Aucune feuille trouvée dans le fichier.");

    const lignes: string[][] = [];
    feuille.eachRow((row) => {
      const valeurs = (row.values as ExcelJS.CellValue[]).slice(1);
      lignes.push(valeurs.map((v) => (v == null ? "" : String(v))));
    });
    return lignes;
  }

  throw new Error("Format non pris en charge. Utilise un fichier .csv, .xlsx ou .xls.");
}

const IDENTIFIANT_REGEX = /^[a-z][a-z0-9]{1,29}$/;

function erreurIdentifiant(
  valeur: string,
  index: number,
  tousLesIdentifiants: string[],
  identifiantsExistants: Set<string>,
): string | null {
  const v = valeur.trim().toLowerCase();
  if (!v) return "Requis.";
  if (!IDENTIFIANT_REGEX.test(v)) return "Lettres/chiffres, commence par une lettre.";
  if (tousLesIdentifiants.some((autre, i) => i !== index && autre.trim().toLowerCase() === v)) {
    return "En double dans cette liste.";
  }
  if (identifiantsExistants.has(v)) return "Déjà utilisé par un autre compte.";
  return null;
}

function telechargerCsv(nomFichier: string, lignes: Record<string, string>[]) {
  const csv = Papa.unparse(lignes);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  a.click();
  URL.revokeObjectURL(url);
}

type Phase = "fichier" | "identifiants" | "resultat";

export function ModaleImportEleves({
  classe,
  onClose,
}: {
  classe: { id: string; nom: string };
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("fichier");
  const [nomFichier, setNomFichier] = useState<string | null>(null);
  const [enChargement, setEnChargement] = useState(false);
  const [analyse, setAnalyse] = useState<ResultatApercuImport | null>(null);
  const [erreurEtape, setErreurEtape] = useState<string | null>(null);

  const [lignesIdentifiant, setLignesIdentifiant] = useState<LigneAvecIdentifiant[]>([]);
  const [identifiantsExistants, setIdentifiantsExistants] = useState<Set<string>>(new Set());
  const [enPreparation, setEnPreparation] = useState(false);
  const [enConfirmation, setEnConfirmation] = useState(false);

  const [resultats, setResultats] = useState<ResultatCreationEleve[]>([]);

  async function handleFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;

    setNomFichier(fichier.name);
    setAnalyse(null);
    setEnChargement(true);
    try {
      const lignes = await lireLignesFichier(fichier);
      setAnalyse(analyserLignesImport(lignes));
    } catch (err) {
      setAnalyse({
        ok: false,
        erreur: err instanceof Error ? err.message : "Impossible de lire ce fichier.",
      });
    } finally {
      setEnChargement(false);
    }
  }

  const valides = analyse?.ok ? analyse.lignes.filter((l) => l.statut === "ok") : [];
  const avertissements = analyse?.ok ? analyse.lignes.filter((l) => l.statut === "avertissement") : [];

  async function handleSuivant() {
    setErreurEtape(null);
    setEnPreparation(true);
    try {
      const res = await preparerIdentifiantsAction(
        valides.map((l) => ({ nom: l.nom, prenom: l.prenom })),
      );
      if (!res.ok) {
        setErreurEtape(res.erreur);
        return;
      }
      setLignesIdentifiant(res.lignes);
      setIdentifiantsExistants(new Set(res.identifiantsExistants));
      setPhase("identifiants");
    } finally {
      setEnPreparation(false);
    }
  }

  const identifiantsActuels = lignesIdentifiant.map((l) => l.identifiant);
  const erreursIdentifiants = lignesIdentifiant.map((_, i) =>
    erreurIdentifiant(identifiantsActuels[i], i, identifiantsActuels, identifiantsExistants),
  );
  const hasErreurIdentifiant = erreursIdentifiants.some((e) => e !== null);

  function handleModifierIdentifiant(index: number, valeur: string) {
    setLignesIdentifiant((prev) =>
      prev.map((l, i) => (i === index ? { ...l, identifiant: valeur } : l)),
    );
  }

  async function handleConfirmer() {
    setErreurEtape(null);
    setEnConfirmation(true);
    try {
      const res = await confirmerImportEleveAction(
        classe.id,
        lignesIdentifiant.map((l) => ({ ...l, identifiant: l.identifiant.trim().toLowerCase() })),
      );
      if (!res.ok) {
        setErreurEtape(res.erreur);
        return;
      }
      setResultats(res.resultats);
      setPhase("resultat");
    } finally {
      setEnConfirmation(false);
    }
  }

  function handleExportCsv() {
    const date = new Date().toISOString().slice(0, 10);
    const nomClasseFichier = classe.nom.replace(/[^a-zA-Z0-9-]+/g, "-");
    telechargerCsv(
      `comptes-${nomClasseFichier}-${date}.csv`,
      resultats.map((r) => ({
        "Nom complet": r.nomComplet,
        Identifiant: r.identifiant,
        "Mot de passe temporaire": r.motDePasseTemp,
      })),
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-space-border bg-space-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-ink-muted hover:text-ink-primary"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-1 font-heading text-lg font-bold text-ink-primary">
          {phase === "resultat" ? "Comptes créés" : "Importer des élèves"}
        </h2>
        <p className="mb-4 text-sm text-ink-secondary">
          Classe <strong>{classe.nom}</strong>
          {phase === "fichier" && ". Fichier CSV ou Excel avec deux colonnes : Nom, Prénom."}
        </p>

        {phase === "fichier" && (
          <>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFichier}
              className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface2 file:px-3 file:py-1 file:text-sm file:text-ink-primary"
            />

            <div className="mt-4 flex-1 overflow-y-auto">
              {enChargement && <p className="text-sm text-ink-muted">Analyse de {nomFichier}…</p>}

              {analyse && !analyse.ok && (
                <p className="flex items-start gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {analyse.erreur}
                </p>
              )}

              {analyse?.ok && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      {valides.length} élève{valides.length > 1 ? "s" : ""} détecté
                      {valides.length > 1 ? "s" : ""}
                    </span>
                    {avertissements.length > 0 && (
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        {avertissements.length} avertissement{avertissements.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <ul className="flex flex-col gap-1">
                    {analyse.lignes.map((l) => (
                      <li
                        key={l.ligne}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                          l.statut === "ok"
                            ? "border-space-border bg-space-surface2/60 text-ink-secondary"
                            : "border-amber-500/20 bg-amber-500/5 text-amber-300"
                        }`}
                      >
                        <span>
                          <span className="text-ink-muted">L{l.ligne} ·</span>{" "}
                          {l.prenom || <em className="text-ink-muted">(prénom manquant)</em>}{" "}
                          {l.nom || <em className="text-ink-muted">(nom manquant)</em>}
                        </span>
                        {l.avertissement && <span>{l.avertissement}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {erreurEtape && <p className="mt-3 text-sm text-red-400">{erreurEtape}</p>}
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={onClose} className="btn-ghost">
                Fermer
              </button>
              {valides.length > 0 && (
                <button
                  type="button"
                  onClick={handleSuivant}
                  disabled={enPreparation}
                  className="btn-primary"
                >
                  {enPreparation
                    ? "Préparation…"
                    : `Suivant (${valides.length} élève${valides.length > 1 ? "s" : ""})`}
                </button>
              )}
            </div>
          </>
        )}

        {phase === "identifiants" && (
          <>
            <p className="mb-3 text-xs text-ink-muted">
              Identifiant proposé pour chaque élève — modifiable si besoin.
            </p>
            <div className="flex-1 overflow-y-auto">
              <ul className="flex flex-col gap-2">
                {lignesIdentifiant.map((l, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-32 shrink-0 truncate text-xs text-ink-secondary">
                        {l.prenom} {l.nom}
                      </span>
                      <input
                        type="text"
                        value={l.identifiant}
                        onChange={(e) => handleModifierIdentifiant(i, e.target.value)}
                        className={`input flex-1 font-mono text-sm ${
                          erreursIdentifiants[i] ? "border-red-500/60" : ""
                        }`}
                      />
                    </div>
                    {erreursIdentifiants[i] && (
                      <p className="ml-32 pl-2 text-xs text-red-400">{erreursIdentifiants[i]}</p>
                    )}
                  </li>
                ))}
              </ul>
              {erreurEtape && <p className="mt-3 text-sm text-red-400">{erreurEtape}</p>}
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setPhase("fichier")} className="btn-ghost">
                Retour
              </button>
              <button
                type="button"
                onClick={handleConfirmer}
                disabled={enConfirmation || hasErreurIdentifiant}
                className="btn-primary"
              >
                {enConfirmation
                  ? "Création…"
                  : `Confirmer l'import (${lignesIdentifiant.length})`}
              </button>
            </div>
          </>
        )}

        {phase === "resultat" && (
          <>
            <p className="mb-3 flex items-center gap-1.5 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {resultats.length} compte{resultats.length > 1 ? "s" : ""} créé
              {resultats.length > 1 ? "s" : ""}.
            </p>

            <div className="flex-1 overflow-y-auto rounded-xl border border-space-border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-space-surface2 text-ink-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Nom complet</th>
                    <th className="px-3 py-2 font-medium">Identifiant</th>
                    <th className="px-3 py-2 font-medium">Mot de passe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-space-border">
                  {resultats.map((r) => (
                    <tr key={r.identifiant}>
                      <td className="px-3 py-2 text-ink-secondary">{r.nomComplet}</td>
                      <td className="px-3 py-2 font-mono text-ink-primary">{r.identifiant}</td>
                      <td className="px-3 py-2 font-mono text-neon-cyan">{r.motDePasseTemp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-ink-muted">
              Ces mots de passe ne seront plus affichés ensuite — télécharge ou note-les
              maintenant.
            </p>

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={onClose} className="btn-ghost">
                Fermer
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="btn-primary gap-1.5"
              >
                <Download className="h-4 w-4" />
                Télécharger en CSV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
