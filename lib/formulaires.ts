// Helpers pour les devoirs de type "PDF-formulaire" : lecture et remplissage
// des champs AcroForm (zones de texte, cases à cocher, listes) via pdf-lib.

import { PDFDocument, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFTextField } from "pdf-lib";
import { ChampFormulaire } from "./formulaire-champs";

export class FormulaireError extends Error {}

export type { ChampFormulaire };

export async function lireChampsFormulaire(pdfBytes: Uint8Array): Promise<ChampFormulaire[]> {
  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes);
  } catch {
    throw new FormulaireError("Fichier PDF invalide.");
  }

  const form = pdfDoc.getForm();
  const champs: ChampFormulaire[] = [];

  for (const champ of form.getFields()) {
    const nom = champ.getName();

    if (champ instanceof PDFTextField) {
      let valeur = "";
      try {
        valeur = champ.getText() ?? "";
      } catch {
        // Champ de texte enrichi (XFA) non pris en charge par pdf-lib : on l'ignore.
        continue;
      }
      champs.push({ nom, type: "texte", multiligne: champ.isMultiline(), valeur });
    } else if (champ instanceof PDFCheckBox) {
      champs.push({ nom, type: "case", valeur: champ.isChecked() });
    } else if (champ instanceof PDFDropdown) {
      champs.push({ nom, type: "choix", options: champ.getOptions(), valeur: champ.getSelected()[0] ?? "" });
    } else if (champ instanceof PDFRadioGroup) {
      champs.push({ nom, type: "choix", options: champ.getOptions(), valeur: champ.getSelected() ?? "" });
    }
    // Les autres types de champs (boutons, signatures) ne sont pas pris en charge.
  }

  return champs;
}

export async function remplirFormulaire(
  pdfBytes: Uint8Array,
  reponses: Record<string, string | boolean>
): Promise<Uint8Array> {
  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes);
  } catch {
    throw new FormulaireError("Fichier PDF invalide.");
  }

  const form = pdfDoc.getForm();

  for (const champ of form.getFields()) {
    const nom = champ.getName();
    const valeur = reponses[nom];
    if (valeur === undefined) continue;

    if (champ instanceof PDFTextField) {
      champ.setText(typeof valeur === "string" ? valeur : "");
    } else if (champ instanceof PDFCheckBox) {
      if (valeur === true) champ.check();
      else champ.uncheck();
    } else if ((champ instanceof PDFDropdown || champ instanceof PDFRadioGroup) && typeof valeur === "string") {
      if (valeur) {
        try {
          champ.select(valeur);
        } catch {
          // Option inconnue : on laisse le champ tel quel.
        }
      } else {
        champ.clear();
      }
    }
  }

  try {
    form.flatten();
  } catch {
    // Si l'aplatissement échoue sur ce PDF, on garde le formulaire rempli mais interactif.
  }

  return pdfDoc.save();
}
