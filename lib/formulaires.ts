// Helpers pour les devoirs de type "PDF-formulaire" : lecture et remplissage
// des champs AcroForm (zones de texte, cases à cocher, listes) via pdf-lib.

import {
  PDFDocument,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFTextField,
  PDFField,
  PDFPage,
  PDFWidgetAnnotation,
  PDFDict,
} from "pdf-lib";
import { ChampFormulaire, PositionChamp, RectanglePdf } from "./formulaire-champs";

export class FormulaireError extends Error {}

export type { ChampFormulaire };

// Détermine l'index de la page sur laquelle apparaît un widget. La plupart
// des PDF renseignent /P sur le widget, mais certains outils (LibreOffice...)
// l'omettent : en repli, on cherche la page dont le tableau /Annots référence
// ce widget (égalité de référence sur son dictionnaire).
function indexPageDuWidget(pdfDoc: PDFDocument, pages: PDFPage[], widget: PDFWidgetAnnotation): number {
  const pageRef = widget.P();
  if (pageRef) {
    const trouve = pages.findIndex((p) => p.ref.toString() === pageRef.toString());
    if (trouve !== -1) return trouve;
  }

  for (let i = 0; i < pages.length; i++) {
    const annots = pages[i].node.Annots();
    if (!annots) continue;

    for (let j = 0; j < annots.size(); j++) {
      const annot = pdfDoc.context.lookup(annots.get(j));
      if (annot instanceof PDFDict && annot === widget.dict) return i;
    }
  }

  return 0;
}

// Détermine, pour chaque widget (zone cliquable/éditable) d'un champ, la page
// sur laquelle il apparaît et son rectangle (repère PDF, origine en bas à
// gauche). Pour un groupe de boutons radio, chaque widget correspond à une
// option distincte (valeurOption).
function positionsDuChamp(pdfDoc: PDFDocument, champ: PDFField): PositionChamp[] {
  const pages = pdfDoc.getPages();
  const positions: PositionChamp[] = [];

  for (const widget of champ.acroField.getWidgets()) {
    const page = indexPageDuWidget(pdfDoc, pages, widget);

    const { x, y, width, height } = widget.getRectangle();
    const rect: RectanglePdf = { x, y, largeur: width, hauteur: height };

    const position: PositionChamp = { page, rect };
    if (champ instanceof PDFRadioGroup) {
      const valeurOption = widget.getOnValue()?.decodeText();
      if (valeurOption !== undefined) position.valeurOption = valeurOption;
    }

    positions.push(position);
  }

  return positions;
}

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
    const positions = positionsDuChamp(pdfDoc, champ);

    if (champ instanceof PDFTextField) {
      let valeur = "";
      try {
        valeur = champ.getText() ?? "";
      } catch {
        // Champ de texte enrichi (XFA) non pris en charge par pdf-lib : on l'ignore.
        continue;
      }
      champs.push({ nom, type: "texte", multiligne: champ.isMultiline(), valeur, positions });
    } else if (champ instanceof PDFCheckBox) {
      champs.push({ nom, type: "case", valeur: champ.isChecked(), positions });
    } else if (champ instanceof PDFDropdown) {
      champs.push({ nom, type: "choix", options: champ.getOptions(), valeur: champ.getSelected()[0] ?? "", positions });
    } else if (champ instanceof PDFRadioGroup) {
      champs.push({ nom, type: "choix", options: champ.getOptions(), valeur: champ.getSelected() ?? "", positions });
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
