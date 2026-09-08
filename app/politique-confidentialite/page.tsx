import type { Metadata } from "next";
import Link from "next/link";
import { LegalLinks } from "@/components/legal-links";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Nadtech",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href="/" className="link-muted text-sm font-medium">
        ← Retour à l&apos;accueil
      </Link>

      <article className="card flex flex-col gap-8 p-6 sm:p-10">
        <header>
          <h1 className="font-heading text-2xl font-bold text-ink-primary sm:text-3xl">
            Politique de confidentialité
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">Dernière mise à jour : 8 septembre 2026.</p>
        </header>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Responsable du traitement</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            <strong className="text-ink-primary">Nader Zaghdoudi</strong>, éditeur de ce site, est responsable
            du traitement des données décrites ci-dessous. Contact :{" "}
            <a className="link-muted underline" href="mailto:nader.zaghdoudi@lfisousse.com">
              nader.zaghdoudi@lfisousse.com
            </a>
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Données collectées</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-secondary">
            <li>
              <strong className="text-ink-primary">Compte</strong> : nom, prénom, adresse email, mot de
              passe (stocké sous forme hachée, jamais en clair).
            </li>
            <li>
              <strong className="text-ink-primary">Élève</strong> : classe et niveau, avatar choisi (style
              et options), horodatage de dernière activité (présence en ligne).
            </li>
            <li>
              <strong className="text-ink-primary">Activité pédagogique</strong> : travaux rendus (devoirs,
              exercices de code), comptes-rendus de séance, résultats de quiz, notes attribuées par
              l&apos;enseignant, participation en classe (main levée).
            </li>
            <li>
              <strong className="text-ink-primary">Mode examen</strong> : verrouillage temporaire et
              signalements techniques destinés à limiter la triche pendant une évaluation chronométrée.
            </li>
            <li>
              <strong className="text-ink-primary">Techniques</strong> : adresse IP, utilisée uniquement
              pour limiter les tentatives abusives de connexion ou de dépôt (pas de suivi publicitaire),
              et cookie de session nécessaire à la connexion.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Finalités</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-secondary">
            <li>Gestion des comptes et de l&apos;accès aux cours.</li>
            <li>Suivi pédagogique par l&apos;enseignant (progression, rendus, notes).</li>
            <li>Communication entre l&apos;enseignant et les élèves (notifications, annonces).</li>
            <li>Sécurité du site (limitation du spam, du bruteforce et de la triche en examen).</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Base légale</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Exécution de la mission d&apos;enseignement et intérêt légitime pédagogique de l&apos;enseignant
            responsable des classes concernées, ainsi que le consentement donné à la création du compte.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Destinataires des données</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Les données sont accessibles à l&apos;élève concerné pour ses propres données, au professeur
            responsable de sa classe, et à l&apos;éditeur du site en tant qu&apos;administrateur technique.
            Elles ne sont ni vendues ni transmises à des tiers à des fins commerciales. Des sous-traitants
            techniques y ont accès dans le cadre strict de l&apos;hébergement (Vercel pour l&apos;application,
            Supabase pour la base de données et les fichiers), soumis à leurs propres garanties de sécurité.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Durée de conservation</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Les données sont conservées pendant la durée d&apos;utilisation de la plateforme par
            l&apos;élève. Un compte et les données associées peuvent être supprimés sur simple demande à
            l&apos;adresse de contact ci-dessus.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Sécurité</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Mots de passe hachés (bcrypt), limitation du nombre de tentatives de connexion avec blocage
            temporaire après plusieurs échecs, connexions chiffrées (HTTPS).
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Mineurs et consentement parental</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            La plupart des élèves utilisant ce site sont mineurs. L&apos;accès à la plateforme se fait par
            un code de classe communiqué par l&apos;enseignant, dans le cadre du suivi pédagogique habituel
            de la classe — la création d&apos;un compte élève relève donc du même cadre que les autres
            outils utilisés en cours. Conformément à l&apos;article 8 du RGPD, si votre enfant a moins de 15
            ans, vous pouvez à tout moment vous opposer à la création ou à la conservation de son compte,
            ou demander l&apos;accès, la rectification ou la suppression de ses données, en écrivant à
            l&apos;adresse ci-dessus.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Vos droits</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
            d&apos;effacement, de limitation et d&apos;opposition concernant vos données, ainsi que d&apos;un
            droit à la portabilité. Pour l&apos;exercer, contactez{" "}
            <a className="link-muted underline" href="mailto:nader.zaghdoudi@lfisousse.com">
              nader.zaghdoudi@lfisousse.com
            </a>
            . Vous pouvez également introduire une réclamation auprès de l&apos;autorité de protection des
            données compétente (par exemple la CNIL en France).
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink-primary">Cookies</h2>
          <p className="text-sm leading-relaxed text-ink-secondary">
            Ce site utilise uniquement un cookie technique de session, nécessaire pour rester connecté.
            Aucun cookie publicitaire ou de mesure d&apos;audience tiers n&apos;est utilisé.
          </p>
        </section>
      </article>

      <LegalLinks className="justify-center text-xs text-ink-muted" />
    </div>
  );
}
