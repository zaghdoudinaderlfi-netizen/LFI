"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { genererIdentifiantsUniques, type LigneAvecIdentifiant, type ResultatCreationEleve } from "@/lib/import-eleves";
import { ImportError, importerEleves } from "@/lib/import-eleves-serveur";
import { verifierProf } from "./actions";

// ── Étape intermédiaire : propose un identifiant par élève ────────────────────

export async function preparerIdentifiantsAction(
  lignes: { nom: string; prenom: string }[],
): Promise<
  | { ok: true; lignes: LigneAvecIdentifiant[]; identifiantsExistants: string[] }
  | { ok: false; erreur: string }
> {
  try {
    await verifierProf();
  } catch {
    return { ok: false, erreur: "Accès refusé." };
  }

  if (lignes.length === 0) {
    return { ok: false, erreur: "Aucun élève à importer." };
  }

  const existants = await prisma.user.findMany({
    where: { identifiant: { not: null } },
    select: { identifiant: true },
  });
  const identifiantsExistants = existants.map((u) => u.identifiant as string);

  const lignesAvecIdentifiant = genererIdentifiantsUniques(lignes, identifiantsExistants);

  return { ok: true, lignes: lignesAvecIdentifiant, identifiantsExistants };
}

// ── Confirmation : crée les comptes ────────────────────────────────────────────

export async function confirmerImportEleveAction(
  classeId: string,
  lignes: LigneAvecIdentifiant[],
): Promise<{ ok: true; resultats: ResultatCreationEleve[] } | { ok: false; erreur: string }> {
  try {
    await verifierProf();
  } catch {
    return { ok: false, erreur: "Accès refusé." };
  }

  try {
    const resultats = await importerEleves(classeId, lignes);
    revalidatePath("/prof/admin");
    return { ok: true, resultats };
  } catch (error) {
    if (error instanceof ImportError) {
      return { ok: false, erreur: error.message };
    }
    throw error;
  }
}
