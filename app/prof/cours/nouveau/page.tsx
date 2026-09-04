import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listerQuizProf } from "@/lib/quiz";
import { creerCoursAction } from "../actions";
import { CoursForm } from "../cours-form";

export default async function NouveauCoursPage() {
  const quizzes = await listerQuizProf();
  const quizzesDisponibles = quizzes.map((q) => ({
    id: q.id,
    titre: q.titre,
    niveau: q.niveau,
    matiere: q.matiere,
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="animate-fade-in-up">
        <Link href="/prof/cours" className="link-muted inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Retour aux cours
        </Link>
        <h1 className="page-title mt-1">Nouveau cours</h1>
      </div>

      <div className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        <CoursForm action={creerCoursAction} submitLabel="Créer le cours" quizzesDisponibles={quizzesDisponibles} />
      </div>
    </div>
  );
}
