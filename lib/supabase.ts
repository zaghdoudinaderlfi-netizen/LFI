import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis.");
}

// Client serveur uniquement : la clé service role contourne les policies RLS.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export const BUCKET_PIECES_JOINTES = "fichiers-lfi";
export const BUCKET_RENDUS_DEVOIRS = "rendus-lfi";

// Bucket public : héberge les images extraites des cours importés depuis
// Word, pour qu'elles puissent être affichées directement (<img src>) sans
// passer par une URL signée.
export const BUCKET_IMAGES_COURS = "images-cours-lfi";

const bucketsVerifies = new Set<string>();

/**
 * Crée le bucket public s'il n'existe pas encore. Idempotent : le résultat
 * est mémorisé en mémoire pour éviter un aller-retour Supabase à chaque
 * upload.
 */
export async function assurerBucketPublic(bucket: string) {
  if (bucketsVerifies.has(bucket)) return;

  const { data } = await supabaseAdmin.storage.getBucket(bucket);
  if (!data) {
    const { error } = await supabaseAdmin.storage.createBucket(bucket, { public: true });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw error;
    }
  }

  bucketsVerifies.add(bucket);
}
