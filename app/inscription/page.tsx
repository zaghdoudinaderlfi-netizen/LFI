import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { InscriptionForm } from "./inscription-form";

export default async function InscriptionPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "PROF" ? "/prof" : "/eleve");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Fonds dégradés arcade discrets */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: [
            "radial-gradient(circle at 15% 10%, rgba(61,214,245,0.07) 0%, transparent 40%)",
            "radial-gradient(circle at 85% 8%,  rgba(255,177,61,0.08) 0%, transparent 40%)",
            "radial-gradient(circle at 50% 110%, rgba(255,93,162,0.06) 0%, transparent 45%)",
          ].join(","),
        }}
      />

      <div className="arcade-screen w-full max-w-sm animate-fade-in-up">
        {/* Chrome fenêtre */}
        <div className="arcade-topbar">
          <div className="flex gap-[6px]">
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: "rgb(var(--arcade-snt))", display: "block" }} />
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: "rgb(var(--arcade-techno))", display: "block" }} />
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: "rgb(var(--arcade-nsi))", display: "block" }} />
          </div>
          <span className="arcade-winname">inscription.nadtech</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <Link href="/" className="mb-6 inline-block">
            <img src="/nadtech-logo.svg" alt="Nadtech" className="h-10 w-auto" />
          </Link>

          <h1 className="font-heading mb-1 text-2xl font-bold text-ink-primary">
            Inscription élève
          </h1>
          <p className="mb-6 text-sm text-ink-secondary">
            Crée ton compte avec le code de classe donné par ton professeur.
          </p>

          <InscriptionForm />

          <p className="mt-6 text-center text-sm text-ink-secondary">
            Déjà un compte ?{" "}
            <Link
              href="/connexion"
              className="font-medium hover:underline"
              style={{ color: "rgb(var(--snt-txt))" }}
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
