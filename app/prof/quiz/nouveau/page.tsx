import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { creerQuizAction } from "../actions";
import { QuizForm } from "../quiz-form";

export default function NouveauQuizPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="animate-fade-in-up">
        <Link href="/prof/quiz" className="link-muted inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Retour aux quiz
        </Link>
        <h1 className="page-title mt-1">Nouveau quiz</h1>
      </div>

      <div className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        <QuizForm action={creerQuizAction} submitLabel="Créer le quiz" />
      </div>
    </div>
  );
}
