import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingPage } from "@/components/landing/landing-page";
import { obtenirCoursVitrine, MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "PROF" ? "/prof" : "/eleve");
  }

  const cours = await obtenirCoursVitrine();
  const coursVitrine = cours
    ? {
        id: cours.id,
        titre: cours.titreInteractif ?? cours.titre,
        matiere: MATIERE_LABELS[cours.matiere],
        niveau: NIVEAU_LABELS[cours.niveau],
      }
    : null;

  return <LandingPage coursVitrine={coursVitrine} />;
}
