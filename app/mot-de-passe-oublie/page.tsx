import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DemanderReinitForm } from "./demander-reinit-form";

export default function MotDePasseOublieePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex w-full max-w-sm items-center justify-between animate-fade-in-up">
        <Link href="/" className="flex items-center">
          <img src="/nadtech-logo.svg" alt="Nadtech" className="h-12 w-auto" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="card w-full max-w-sm animate-fade-in-up p-6">
        <h1 className="page-title mb-1">Mot de passe oublié</h1>
        <p className="mb-6 text-sm text-ink-secondary">
          Saisis ton adresse email : tu recevras un lien pour choisir un nouveau mot de passe.
        </p>

        <DemanderReinitForm />

        <p className="mt-6 text-center text-sm text-ink-secondary">
          <Link href="/connexion" className="font-medium text-neon-cyan hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>

      <p className="mt-6 max-w-sm text-center text-sm text-ink-muted animate-fade-in-up">
        Tu n&apos;as pas d&apos;adresse email associée à ton compte ?{" "}
        <strong className="text-ink-secondary">Demande à ton professeur</strong> de réinitialiser
        ton mot de passe depuis son interface d&apos;administration.
      </p>
    </main>
  );
}
