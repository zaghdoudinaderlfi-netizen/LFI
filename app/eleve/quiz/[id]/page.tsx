import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obtenirQuizVisibleEleve, meilleurScoreEleve } from "@/lib/quiz";
import { QuizJeu } from "./quiz-jeu";

export default async function EleveQuizJouerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { classe: true },
      })
    : null;

  if (!user?.classe) {
    notFound();
  }

  const quiz = await obtenirQuizVisibleEleve(id, user.classe.niveau);
  if (!quiz) {
    notFound();
  }

  const meilleure = await meilleurScoreEleve(quiz.id, user.id);

  return (
    <QuizJeu
      quizId={quiz.id}
      titre={quiz.titre}
      nbQuestions={quiz._count.questions}
      meilleurScore={meilleure?.score ?? null}
    />
  );
}
