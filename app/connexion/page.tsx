import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LoginForm } from "./login-form";

export default async function ConnexionPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "PROF" ? "/prof" : "/eleve");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex w-full max-w-sm items-center justify-between animate-fade-in-up">
        <Link href="/" className="flex items-center">
          <img src="/nadtech-logo.svg" alt="Nadtech" className="h-12 w-auto" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="card w-full max-w-sm animate-fade-in-up p-6">
        <h1 className="page-title mb-1">Connexion</h1>
        <p className="mb-6 text-sm text-ink-secondary">Accède à ton espace Nadtech.</p>

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
