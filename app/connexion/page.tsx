import Link from "next/link";
import { redirect } from "next/navigation";
import { Rocket } from "lucide-react";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function ConnexionPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "PROF" ? "/prof" : "/eleve");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2 animate-fade-in-up">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-blue to-neon-violet shadow-glow-soft">
          <Rocket className="h-5 w-5 text-space-bg" />
        </span>
        <span className="font-heading text-2xl font-bold tracking-tight text-ink-primary">LFI</span>
      </div>

      <div className="card w-full max-w-sm animate-fade-in-up p-6">
        <h1 className="page-title mb-1">Connexion</h1>
        <p className="mb-6 text-sm text-ink-secondary">Accède à ton espace LFI.</p>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-ink-secondary">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-medium text-neon-cyan hover:underline">
            Inscription élève
          </Link>
        </p>
      </div>
    </main>
  );
}
