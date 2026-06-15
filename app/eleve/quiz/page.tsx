import { Gamepad2 } from "lucide-react";

export default function EleveQuizPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="page-title animate-fade-in-up">Quiz</h1>

      <div className="card animate-fade-in-up flex flex-col items-center gap-3 p-10 text-center [animation-delay:60ms]">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-space-surface2 text-neon-violet shadow-glow-soft">
          <Gamepad2 className="h-7 w-7" />
        </span>
        <p className="text-ink-secondary">
          Les quiz ludiques arrivent bientôt. Reviens un peu plus tard !
        </p>
      </div>
    </div>
  );
}
