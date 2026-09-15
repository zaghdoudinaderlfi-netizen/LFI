import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { obtenirQuizPourFlashcards } from "@/lib/quiz";
import { FlashcardsRevision } from "./flashcards-revision";

export default async function FlashcardsPage({
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

  const data = await obtenirQuizPourFlashcards(id, user.classe.niveau);
  if (!data) {
    notFound();
  }

  return <FlashcardsRevision quizId={id} titre={data.titre} questions={data.questions} />;
}
