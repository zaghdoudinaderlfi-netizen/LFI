import type { Metadata } from "next";
import Link from "next/link";
import { LegalLinks } from "@/components/legal-links";

export const metadata: Metadata = {
  title: "Mentions légales — Nadtech",
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href="/" className="link-muted text-sm font-medium">
        ← Retour à l&apos;accueil
      </Link>

      <article className="card flex flex-col gap-8 p-6 sm:p-10">
        <header>
          <h1 className="font-heading text-2xl font-bold text-ink-primary sm:text-3xl">
            Mentions légales
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">Dernière mise à jour : 8 septembre 2026.</p>
        </header>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Éditeur du site</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Ce site est un projet personnel à vocation pédagogique, édité et maintenu par :
          </p>
          <p className="text-sm leading-relaxed text-ink-secondary">
            <strong className="text-ink-primary">Nader Zaghdoudi</strong>
            <br />
            Contact : <a className="link-muted underline" href="mailto:nader.zaghdoudi@lfisousse.com">nader.zaghdoudi@lfisousse.com</a>
          </p>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Ce site n&apos;a pas de statut commercial : il n&apos;est ni édité ni exploité au nom d&apos;un
            établissement scolaire, même s&apos;il est utilisé dans un cadre pédagogique.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Directeur de la publication</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">Nader Zaghdoudi.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Hébergement</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-secondary">
            <li>
              Application web : Vercel Inc. — coordonnées complètes sur{" "}
              <a className="link-muted underline" href="https://vercel.com/legal" target="_blank" rel="noopener noreferrer">
                vercel.com/legal
              </a>
            </li>
            <li>
              Base de données et fichiers déposés : Supabase, Inc. — coordonnées complètes sur{" "}
              <a className="link-muted underline" href="https://supabase.com/legal" target="_blank" rel="noopener noreferrer">
                supabase.com/legal
              </a>
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Propriété intellectuelle</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Les cours, exercices, énoncés et autres contenus pédagogiques publiés sur ce site sont la
            propriété de leur auteur, sauf mention contraire. Toute reproduction ou diffusion en dehors
            du cadre de la classe, sans autorisation, est interdite.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Données personnelles</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Le traitement des données personnelles des utilisateurs est détaillé dans la{" "}
            <Link href="/politique-confidentialite" className="link-muted underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Contact</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Pour toute question relative au site :{" "}
            <a className="link-muted underline" href="mailto:nader.zaghdoudi@lfisousse.com">
              nader.zaghdoudi@lfisousse.com
            </a>
          </p>
        </section>
      </article>

      <LegalLinks className="justify-center text-xs text-ink-muted" />
    </div>
  );
}
