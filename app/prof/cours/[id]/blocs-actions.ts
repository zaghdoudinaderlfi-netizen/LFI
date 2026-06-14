"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  ajouterBlocActivite,
  ajouterBlocEditeurPython,
  ajouterBlocImage,
  ajouterBlocLien,
  ajouterBlocPdf,
  ajouterBlocTexte,
  ajouterBlocVideo,
  BlocError,
  deplacerBloc,
  supprimerBloc,
} from "@/lib/blocs";

export async function ajouterBlocAction(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const session = await auth();
  if (session?.user?.role !== "PROF") {
    return "Accès réservé aux professeurs.";
  }

  const coursId = formData.get("coursId");
  const type = formData.get("type");
  if (typeof coursId !== "string" || typeof type !== "string") {
    return "Formulaire invalide.";
  }

  try {
    switch (type) {
      case "TEXTE": {
        const contenu = formData.get("contenu");
        if (typeof contenu !== "string") return "Formulaire invalide.";
        await ajouterBlocTexte(coursId, contenu);
        break;
      }
      case "IMAGE": {
        const fichier = formData.get("fichier");
        if (!(fichier instanceof File) || fichier.size === 0) {
          return "Choisis une image.";
        }
        await ajouterBlocImage(coursId, fichier);
        break;
      }
      case "PDF": {
        const fichier = formData.get("fichier");
        if (!(fichier instanceof File) || fichier.size === 0) {
          return "Choisis un fichier PDF.";
        }
        await ajouterBlocPdf(coursId, fichier);
        break;
      }
      case "VIDEO": {
        const lien = formData.get("lien");
        if (typeof lien !== "string") return "Formulaire invalide.";
        await ajouterBlocVideo(coursId, lien);
        break;
      }
      case "EDITEUR_PYTHON": {
        const consigne = formData.get("consigne");
        const codeDepart = formData.get("codeDepart");
        if (typeof consigne !== "string") return "Formulaire invalide.";
        await ajouterBlocEditeurPython(coursId, {
          consigne,
          codeDepart: typeof codeDepart === "string" ? codeDepart : undefined,
        });
        break;
      }
      case "ACTIVITE": {
        const titre = formData.get("titre");
        const outilSelect = formData.get("outil");
        const outilAutre = formData.get("outilAutre");
        const lien = formData.get("lien");
        if (typeof outilSelect !== "string" || typeof lien !== "string") {
          return "Formulaire invalide.";
        }

        const outil =
          outilSelect === "AUTRE"
            ? typeof outilAutre === "string" ? outilAutre.trim() : ""
            : outilSelect;

        if (!outil) return "Précise le nom de l'outil.";

        await ajouterBlocActivite(coursId, {
          titre: typeof titre === "string" ? titre : undefined,
          outil,
          lien,
        });
        break;
      }
      case "LIEN": {
        const titre = formData.get("titre");
        const lien = formData.get("lien");
        if (typeof titre !== "string" || typeof lien !== "string") {
          return "Formulaire invalide.";
        }
        await ajouterBlocLien(coursId, { titre, lien });
        break;
      }
      default:
        return "Type de bloc inconnu.";
    }
  } catch (error) {
    if (error instanceof BlocError) return error.message;
    throw error;
  }

  revalidatePath(`/prof/cours/${coursId}`);
  revalidatePath(`/prof/cours/${coursId}/apercu`);
  return "Bloc ajouté.";
}

export async function supprimerBlocAction(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("id");
  const coursId = formData.get("coursId");
  if (typeof id !== "string" || typeof coursId !== "string") return;

  await supprimerBloc(id);

  revalidatePath(`/prof/cours/${coursId}`);
  revalidatePath(`/prof/cours/${coursId}/apercu`);
}

export async function deplacerBlocAction(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "PROF") return;

  const id = formData.get("id");
  const coursId = formData.get("coursId");
  const direction = formData.get("direction");
  if (
    typeof id !== "string" ||
    typeof coursId !== "string" ||
    (direction !== "haut" && direction !== "bas")
  ) {
    return;
  }

  await deplacerBloc(id, direction);

  revalidatePath(`/prof/cours/${coursId}`);
  revalidatePath(`/prof/cours/${coursId}/apercu`);
}
