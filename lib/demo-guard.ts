import { NextResponse } from "next/server";

// Les routes API sous /api sont exclues du matcher du middleware (voir
// middleware.ts) — le blocage anti-écriture des comptes isDemo posé dans
// auth.config.ts (basé sur l'en-tête "next-action") ne les couvre donc pas.
// Chaque route API qui écrit en base doit appeler ce garde-fou explicitement,
// juste après avoir lu la session.
export function reponseDemoBloquee() {
  return NextResponse.json(
    { error: "Fonctionnalité désactivée en mode démonstration." },
    { status: 403 }
  );
}
