// Upload/suppression de la photo de profil (voir User.avatarPhotoUrl) —
// séparé de lib/avatar.ts (qui génère les avatars dessinés Avataaars) car ce
// module importe supabaseAdmin : lib/avatar.ts, lui, est importé par des
// composants client (AvatarDisplay via app-shell.tsx), et embarquer
// supabaseAdmin dans ce module aurait fait fuiter la clé service role dans
// le bundle client.
import { randomUUID } from "crypto";
import { supabaseAdmin, assurerBucketPublic, BUCKET_AVATARS_PHOTOS } from "./supabase";
import { nomFichierSur } from "./fichiers";

export class AvatarPhotoError extends Error {}

const TAILLE_MAX_PHOTO = 5 * 1024 * 1024; // 5 Mo
const EXTENSIONS_PHOTO = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

/** Upload la photo et renvoie son URL publique complète (à stocker telle quelle). */
export async function televerserPhotoAvatar(userId: string, fichier: File): Promise<string> {
  if (fichier.size > TAILLE_MAX_PHOTO) {
    throw new AvatarPhotoError("La photo dépasse la taille maximale autorisée (5 Mo).");
  }

  const ext = fichier.name.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSIONS_PHOTO.has(ext)) {
    throw new AvatarPhotoError("Format d'image non supporté. Utilise PNG, JPG, GIF ou WebP.");
  }

  await assurerBucketPublic(BUCKET_AVATARS_PHOTOS);

  const nomNettoye = nomFichierSur(fichier.name);
  const chemin = `${userId}/${randomUUID()}-${nomNettoye}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET_AVATARS_PHOTOS).upload(chemin, fichier, {
    contentType: fichier.type || "image/png",
    upsert: false,
  });
  if (error) throw new AvatarPhotoError("Échec de l'envoi de la photo.");

  const { data } = supabaseAdmin.storage.from(BUCKET_AVATARS_PHOTOS).getPublicUrl(chemin);
  return data.publicUrl;
}

/** Supprime la photo précédente du stockage à partir de son URL publique. */
export async function supprimerPhotoAvatar(url: string | null) {
  if (!url) return;
  const marqueur = `/${BUCKET_AVATARS_PHOTOS}/`;
  const index = url.indexOf(marqueur);
  if (index === -1) return;
  const chemin = url.slice(index + marqueur.length);
  await supabaseAdmin.storage.from(BUCKET_AVATARS_PHOTOS).remove([chemin]);
}
