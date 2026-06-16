import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { validerToken } from "../../actions";
import { ReinitialiserMdpForm } from "./reinitialiser-mdp-form";

export default async function ReinitialiserMdpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const check = await validerToken(token);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex w-full max-w-sm items-center justify-between animate-fade-in-up">
        <Link href="/" className="flex items-center">
          <img src="/nadtech-logo.svg" alt="Nadtech" className="h-12 w-auto" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="card w-full max-w-sm animate-fade-in-up p-6">
        {!check.valide ? (
          <>
            <h1 className="page-title mb-1">Lien invalide</h1>
            <p className="mb-4 text-sm text-ink-secondary">{check.raison}</p>
            <Link href="/mot-de-passe-oublie" className="btn-primary block text-center">
              Refaire la demande
            </Link>
          </>
        ) : (
          <>
            <h1 className="page-title mb-1">Nouveau mot de passe</h1>
            <p className="mb-6 text-sm text-ink-secondary">
              Choisis un mot de passe sécurisé d&apos;au moins 8 caractères.
            </p>
            <ReinitialiserMdpForm token={token} />
          </>
        )}

        <p className="mt-6 text-center text-sm text-ink-secondary">
          <Link href="/connexion" className="font-medium text-neon-cyan hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
