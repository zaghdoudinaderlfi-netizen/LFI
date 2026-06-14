import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "PROF" ? "/prof" : "/eleve");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="text-4xl font-bold text-slate-800 mb-2">LFI</h1>
      <p className="text-slate-500 mb-8">
        Plateforme pédagogique — Technologie &amp; SNT
      </p>
      <div className="flex gap-4">
        <Link
          href="/connexion"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Connexion
        </Link>
        <Link
          href="/inscription"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Inscription élève
        </Link>
      </div>
    </main>
  );
}
