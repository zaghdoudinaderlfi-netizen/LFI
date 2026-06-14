import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { InscriptionForm } from "./inscription-form";

export default async function InscriptionPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "PROF" ? "/prof" : "/eleve");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          Inscription élève
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Crée ton compte avec le code de classe donné par ton professeur.
        </p>

        <InscriptionForm />

        <p className="mt-6 text-center text-sm text-slate-500">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-slate-800 underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
