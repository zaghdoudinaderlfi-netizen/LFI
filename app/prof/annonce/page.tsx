import Link from "next/link";
import { ArrowLeft, Download, Megaphone, Paperclip } from "lucide-react";
import { listerAnnonces, formaterTaille } from "@/lib/annonces";
import { AnnonceForm } from "./annonce-form";
import { desactiverAnnonceAction, reactiverAnnonceAction, supprimerAnnonceAction } from "./actions";

export default async function ProfAnnoncePage() {
  const annonces = await listerAnnonces();
  const active = annonces.find((a) => a.actif) ?? null;
  const historique = annonces.filter((a) => !a.actif);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/prof" className="btn-secondary w-fit animate-fade-in-up">
        <ArrowLeft className="h-4 w-4" />
        Tableau de bord
      </Link>

      <div className="animate-fade-in-up">
        <h1 className="page-title flex items-center gap-2">
          <Megaphone className="h-6 w-6" style={{ color: "rgb(var(--neon-violet))" }} />
          Annonce aux élèves
        </h1>
        <p className="text-sm text-ink-secondary">
          Diffuse un message (consigne, information, document) dans une bulle bien visible sur le
          tableau de bord de tous les élèves.
        </p>
      </div>

      <section className="card-hard card-hard-violet animate-fade-in-up p-6 [animation-delay:60ms]">
        <h2 className="section-title mb-4">
          {active ? "Remplacer l'annonce en cours" : "Diffuser une annonce"}
        </h2>
        <AnnonceForm />
      </section>

      {active && (
        <section className="card-hard card-hard-violet animate-fade-in-up p-6 [animation-delay:100ms]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="section-title">Actuellement affichée</h2>
            <form action={desactiverAnnonceAction}>
              <input type="hidden" name="id" value={active.id} />
              <button type="submit" className="btn-secondary text-sm">
                Masquer aux élèves
              </button>
            </form>
          </div>
          <p className="whitespace-pre-wrap text-ink-primary">{active.message}</p>
          {active.fichierNom && (
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-secondary">
              <Paperclip className="h-4 w-4" />
              {active.fichierNom}
              {active.fichierTaille != null && ` (${formaterTaille(active.fichierTaille)})`}
            </p>
          )}
          <p className="mt-2 text-xs text-ink-muted">
            Diffusée le {active.createdAt.toLocaleDateString("fr-FR")} à{" "}
            {active.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </section>
      )}

      {historique.length > 0 && (
        <section className="animate-fade-in-up [animation-delay:140ms]">
          <h2 className="section-title mb-3">Historique</h2>
          <ul className="flex flex-col gap-3">
            {historique.map((a) => (
              <li key={a.id} className="card flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap text-sm text-ink-primary">{a.message}</p>
                  <div className="flex shrink-0 gap-2">
                    <form action={reactiverAnnonceAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="link-muted text-xs font-medium">
                        Republier
                      </button>
                    </form>
                    <form action={supprimerAnnonceAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="text-xs font-medium text-red-400 hover:underline">
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
                {a.fichierNom && (
                  <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Download className="h-3.5 w-3.5" />
                    {a.fichierNom}
                  </p>
                )}
                <p className="text-xs text-ink-muted">{a.createdAt.toLocaleDateString("fr-FR")}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
