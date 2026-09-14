import { signOut } from "@/auth";

// Route API (pas une Server Action) : le blocage anti-écriture du middleware
// pour les comptes isDemo (voir auth.config.ts) refuse toute Server Action,
// déconnexion démo comprise. /api/* est exclu du matcher du middleware, donc
// cette route reste accessible — signOut() ne mute aucune donnée applicative.
export async function POST() {
  await signOut({ redirectTo: "/" });
}
