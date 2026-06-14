import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function ConnexionPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "PROF" ? "/prof" : "/eleve");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Connexion</h1>
        <p className="text-sm text-slate-500 mb-6">
          Accédez à votre espace LFI.
        </p>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-slate-500">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-slate-800 underline">
            Inscription élève
          </Link>
        </p>
      </div>
    </main>
  );
}
