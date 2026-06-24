import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  BookOpen,
  ClipboardCheck,
  Code2,
  ExternalLink,
  Gamepad2,
  GraduationCap,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/auth";
import { LandingHeader } from "@/components/landing/landing-header";

const FONCTIONNALITES: {
  icon: LucideIcon;
  titre: string;
  description: string;
  gradient: string;
  bientot?: boolean;
}[] = [
  {
    icon: BookOpen,
    titre: "Cours multimédia",
    description:
      "Des supports de cours interactifs : textes, vidéos, documents et exercices intégrés, pour apprendre à son rythme.",
    gradient: "from-neon-blue to-neon-violet",
  },
  {
    icon: Code2,
    titre: "Code en ligne Python & Arduino",
    description:
      "Un éditeur intégré pour écrire et exécuter du code Python — avec tortue graphique — directement dans le navigateur.",
    gradient: "from-neon-cyan to-neon-blue",
  },
  {
    icon: ClipboardCheck,
    titre: "Travail à faire & corrections",
    description:
      "Devoirs, rendus de fichiers et corrections : tout le suivi du travail et des notes au même endroit.",
    gradient: "from-neon-violet to-neon-pink",
  },
  {
    icon: Gamepad2,
    titre: "Quiz",
    description: "Des quiz interactifs pour réviser en s'amusant et vérifier ses connaissances.",
    gradient: "from-neon-pink to-neon-cyan",
    bientot: true,
  },
];

const ETAPES: { icon: LucideIcon; titre: string; description: string }[] = [
  {
    icon: UserPlus,
    titre: "Inscris-toi avec le code de ta classe",
    description:
      "Ton professeur te communique un code de classe : utilise-le pour créer ton compte élève en quelques secondes.",
  },
  {
    icon: BookOpen,
    titre: "Retrouve tes cours",
    description: "Accède à tous les cours de ta classe : supports, ressources, exercices et activités interactives.",
  },
  {
    icon: Award,
    titre: "Fais les exercices et suis tes notes",
    description:
      "Réalise les devoirs, dépose ton travail, corrige ton code et consulte tes résultats au même endroit.",
  },
];

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "PROF" ? "/prof" : "/eleve");
  }

  return (
    <div className="min-h-screen">
      <LandingHeader />

      {/* En-tête / accroche */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <p className="eyebrow animate-fade-in-up">Plateforme pédagogique</p>
        <h1 className="mt-3 animate-fade-in-up [animation-delay:60ms]">
          <img src="/nadtech-logo.svg" alt="Nadtech" className="h-16 w-auto sm:h-20 lg:h-24" />
        </h1>
        <p className="mt-4 max-w-2xl animate-fade-in-up text-balance text-lg text-ink-secondary [animation-delay:120ms]">
          Plateforme pédagogique de Technologie, SNT &amp; NSI — cours, exercices interactifs et code en ligne.
        </p>
        <div className="mt-8 flex animate-fade-in-up flex-wrap items-center justify-center gap-3 [animation-delay:180ms]">
          <Link href="/connexion" className="btn-secondary">
            Se connecter
          </Link>
          <Link href="/inscription" className="btn-primary">
            S&apos;inscrire
          </Link>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Fonctionnalités</p>
          <h2 className="page-title mt-2">Tout pour apprendre la Technologie, le SNT &amp; la NSI</h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FONCTIONNALITES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.titre} className="card-interactive flex flex-col gap-3 p-6">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${f.gradient} shadow-glow-soft`}
                  >
                    <Icon className="h-5 w-5 text-accent-fg" />
                  </span>
                  {f.bientot && (
                    <span className="rounded-full bg-neon-pink/15 px-2 py-0.5 text-xs font-semibold text-neon-pink">
                      Bientôt
                    </span>
                  )}
                </div>
                <h3 className="section-title">{f.titre}</h3>
                <p className="text-sm text-ink-secondary">{f.description}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-ink-muted">Visuels et exemples à titre de démonstration.</p>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Comment ça marche</p>
          <h2 className="page-title mt-2">Trois étapes pour démarrer</h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {ETAPES.map((etape, i) => {
            const Icon = etape.icon;
            return (
              <div key={etape.titre} className="card flex flex-col gap-3 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-blue to-neon-violet font-heading text-sm font-bold text-accent-fg shadow-glow-soft">
                    {i + 1}
                  </span>
                  <Icon className="h-6 w-6 text-neon-cyan" />
                </div>
                <h3 className="section-title">{etape.titre}</h3>
                <p className="text-sm text-ink-secondary">{etape.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* À propos */}
      <section id="a-propos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="card grid grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-[280px_1fr] lg:items-start">
          {/* Emplacement photo (éditable) : remplacer ce cadre par la photo
              de Nader Zaghdoudi, par ex. avec next/image et un fichier
              placé dans /public (ex. /public/about-nader.jpg). */}
          <div className="mx-auto flex aspect-square w-48 shrink-0 items-center justify-center rounded-2xl border border-space-border bg-gradient-to-br from-space-surface2 to-space-deep shadow-glow-soft sm:w-56 lg:mx-0 lg:w-full">
            <GraduationCap className="h-16 w-16 text-neon-cyan/70" />
          </div>

          <div>
            <p className="eyebrow">À propos</p>
            <h2 className="page-title mt-2">Nader Zaghdoudi</h2>
            <p className="mt-1 text-sm font-medium text-ink-secondary">
              Professeur de Technologie, SNT &amp; NSI · Ingénieur en Génie Électrique
            </p>

            <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-ink-secondary sm:text-base">
              <p>
                Enseignant du réseau AEFE depuis plus de 10 ans, je conçois une pédagogie active où les élèves
                apprennent en créant : robotique, programmation, intelligence artificielle et développement durable.
                Spécialisé en NSI et SNT, j&apos;ai accompagné des projets élèves primés à l&apos;international — du
                1er Prix Projet X pour un lombricomposteur connecté à un robot aquatique de dépollution marine, en
                passant par les Trophées NSI et la First Lego League.
              </p>
              <p>
                Ingénieur en génie électrique et doctorant en IoT et villes intelligentes, je relie en permanence le
                terrain de la classe et la technologie de pointe. J&apos;ai créé Nadtech pour rassembler en un seul
                espace mes cours, des activités interactives et des outils de code en ligne, et donner à chaque élève
                les moyens de progresser à son rythme.
              </p>
            </div>

            <a
              href="https://cutt.ly/0hddRq1"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary mt-6 inline-flex"
            >
              Mon profil LinkedIn
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-space-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-8 text-center text-sm text-ink-muted sm:px-6 lg:px-8">
          <p>Nadtech — conçu et développé par Nader Zaghdoudi</p>
          <p>© {new Date().getFullYear()} Nadtech</p>
        </div>
      </footer>
    </div>
  );
}
