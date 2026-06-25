import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DemanderReinitForm } from "./demander-reinit-form";

export default function MotDePasseOublieePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: [
            "radial-gradient(circle at 20% 15%, rgba(255,177,61,0.07) 0%, transparent 40%)",
            "radial-gradient(circle at 80% 10%, rgba(61,214,245,0.07) 0%, transparent 40%)",
          ].join(","),
        }}
      />

      <div className="arcade-screen w-full max-w-sm animate-fade-in-up">
        <div className="arcade-topbar">
          <div className="flex gap-[6px]">
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: "rgb(var(--arcade-techno))", display: "block" }} />
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: "rgb(var(--arcade-snt))", display: "block" }} />
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: "rgb(var(--arcade-nsi))", display: "block" }} />
          </div>
          <span className="arcade-winname">reinit-mdp.nadtech</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="p-6">
          <Link href="/" className="mb-6 inline-block">
            <img src="/nadtech-logo.svg" alt="Nadtech" className="h-10 w-auto" />
          </Link>

          <h1 className="font-heading mb-1 text-2xl font-bold text-ink-primary">
            Mot de passe oublié
          </h1>
          <p className="mb-6 text-sm text-ink-secondary">
            Saisis ton adresse email : tu recevras un lien pour choisir un nouveau mot de passe.
          </p>

          <DemanderReinitForm />

          <p className="mt-6 text-center text-sm text-ink-secondary">
            <Link
              href="/connexion"
              className="font-medium hover:underline"
              style={{ color: "rgb(var(--snt-txt))" }}
            >
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>

      <p className="mt-6 w-full max-w-sm text-center text-sm text-ink-muted animate-fade-in-up">
        Tu n&apos;as pas d&apos;adresse email associée à ton compte ?{" "}
        <strong className="text-ink-secondary">Demande à ton professeur</strong> de réinitialiser
        ton mot de passe depuis son interface d&apos;administration.
      </p>
    </main>
  );
}
