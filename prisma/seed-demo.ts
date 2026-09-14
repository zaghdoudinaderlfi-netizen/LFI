import "dotenv/config";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  CODE_INSCRIPTION_CLASSE_DEMO,
  EMAIL_ELEVE_DEMO,
  EMAIL_PROF_DEMO,
} from "../lib/demo-constants";

// Client Prisma dédié à ce script (pas d'import de lib/prisma.ts, qui charge
// "server-only" et casse hors runtime Next.js — voir aussi prisma/seed.ts).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Seed dédié à la démo publique (bouton "Voir la démo" sur l'accueil, sans
// connexion) — indépendant de prisma/seed.ts (bootstrap initial de la base).
// Rejouable à volonté : tout est fait par upsert, donc relancer ce script
// (`npm run seed:demo`) remet les comptes et données de démo dans un état
// propre si elles se sont dégradées (ex: un visiteur a quand même réussi à
// modifier quelque chose, ou pour rafraîchir les dates).
//
// Niveau/matière : PREMIERE ⇔ NSI (voir MATIERE_PAR_NIVEAU dans
// lib/classes-constants.ts — c'est la seule combinaison valide pour ce
// niveau, toutes les requêtes élève/prof filtrent strictement les deux
// ensemble).

function anneeScolaireActuelle(): string {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  // L'année scolaire démarre en septembre (mois index 8).
  return maintenant.getMonth() >= 8 ? `${annee}-${annee + 1}` : `${annee - 1}-${annee}`;
}

async function motDePasseInutilisable(): Promise<string> {
  // Les comptes démo ne se connectent jamais via le formulaire email/mot de
  // passe (voir demarrerDemoAction) : ce hash ne sert donc jamais, mais le
  // champ est requis en base et bcrypt.compare doit pouvoir s'exécuter dessus
  // sans erreur si jamais quelqu'un essayait.
  return bcrypt.hash(randomUUID() + randomUUID(), 10);
}

const CONTENU_COURS_1 = `# Découverte de Python

Python est un langage de programmation simple à lire, utilisé aussi bien pour l'apprentissage que par de grandes entreprises (instagram, Netflix...).

## Ta première instruction

\`\`\`python
print("Bonjour, NSI !")
\`\`\`

## Variables

Une variable stocke une valeur sous un nom choisi :

\`\`\`python
prenom = "Alex"
age = 16
print(prenom, "a", age, "ans")
\`\`\`

## À retenir

1. Python s'exécute ligne par ligne, de haut en bas.
2. Une variable peut changer de valeur à tout moment.
3. \`print()\` affiche un résultat à l'écran.
`;

const CONTENU_COURS_2 = `# Les algorithmes de tri

Trier une liste, c'est ranger ses éléments dans un ordre (croissant ou décroissant). C'est l'un des problèmes les plus étudiés en informatique.

## Le tri à bulles

Principe : on compare les éléments voisins deux à deux, et on les échange s'ils sont dans le mauvais ordre. On répète jusqu'à ce que la liste soit triée.

\`\`\`python
def tri_a_bulles(liste):
    n = len(liste)
    for i in range(n):
        for j in range(n - i - 1):
            if liste[j] > liste[j + 1]:
                liste[j], liste[j + 1] = liste[j + 1], liste[j]
    return liste
\`\`\`

## Complexité

Le tri à bulles compare jusqu'à n² éléments : il devient lent sur de grandes listes, mais reste un bon point de départ pour comprendre le tri.
`;

async function main() {
  // ── Classe démo (isolée des vraies classes) ──────────────────────────
  const classe = await prisma.classe.upsert({
    where: { codeInscription: CODE_INSCRIPTION_CLASSE_DEMO },
    update: { estDemo: true },
    create: {
      nom: "Classe Démo",
      niveau: "PREMIERE",
      codeInscription: CODE_INSCRIPTION_CLASSE_DEMO,
      anneeScolaire: anneeScolaireActuelle(),
      estDemo: true,
    },
  });

  // ── Comptes démo ──────────────────────────────────────────────────────
  const motDePasse = await motDePasseInutilisable();

  const eleveDemo = await prisma.user.upsert({
    where: { email: EMAIL_ELEVE_DEMO },
    update: { isDemo: true, classeId: classe.id, nom: "Démo", prenom: "Élève", role: "ELEVE" },
    create: {
      email: EMAIL_ELEVE_DEMO,
      nom: "Démo",
      prenom: "Élève",
      motDePasse,
      role: "ELEVE",
      classeId: classe.id,
      isDemo: true,
    },
  });

  const profDemo = await prisma.user.upsert({
    where: { email: EMAIL_PROF_DEMO },
    update: { isDemo: true, nom: "Démo", prenom: "Prof", role: "PROF" },
    create: {
      email: EMAIL_PROF_DEMO,
      nom: "Démo",
      prenom: "Prof",
      motDePasse,
      role: "PROF",
      isDemo: true,
    },
  });

  // ── Cours ─────────────────────────────────────────────────────────────
  const cours1 = await prisma.cours.upsert({
    where: { slug: "demo-decouverte-de-python" },
    update: {
      contenu: CONTENU_COURS_1,
      publie: true,
      visibleEleves: true,
      niveau: "PREMIERE",
      matiere: "NSI",
    },
    create: {
      titre: "Découverte de Python",
      slug: "demo-decouverte-de-python",
      niveau: "PREMIERE",
      matiere: "NSI",
      publie: true,
      visibleEleves: true,
      ordre: 1,
      chapitre: 1,
      contenu: CONTENU_COURS_1,
    },
  });

  const cours2 = await prisma.cours.upsert({
    where: { slug: "demo-algorithmes-de-tri" },
    update: {
      contenu: CONTENU_COURS_2,
      publie: true,
      visibleEleves: true,
      niveau: "PREMIERE",
      matiere: "NSI",
    },
    create: {
      titre: "Les algorithmes de tri",
      slug: "demo-algorithmes-de-tri",
      niveau: "PREMIERE",
      matiere: "NSI",
      publie: true,
      visibleEleves: true,
      ordre: 2,
      chapitre: 2,
      contenu: CONTENU_COURS_2,
    },
  });

  // ── Devoirs : un à rendre, un déjà noté ─────────────────────────────
  const dansDeuxSemaines = new Date();
  dansDeuxSemaines.setDate(dansDeuxSemaines.getDate() + 14);

  let devoirARendre = await prisma.exercice.findFirst({
    where: { coursId: cours1.id, titre: "Rendu : premier programme Python" },
  });
  if (!devoirARendre) {
    devoirARendre = await prisma.exercice.create({
      data: {
        coursId: cours1.id,
        titre: "Rendu : premier programme Python",
        consigne: "Écris un petit programme Python qui demande ton prénom et affiche un message de bienvenue, puis dépose-le ici.",
        type: "DEVOIR_PDF",
        points: 20,
        ordre: 1,
        dateLimite: dansDeuxSemaines,
      },
    });
  }

  let devoirNote = await prisma.exercice.findFirst({
    where: { coursId: cours2.id, titre: "Exercice noté : tri à bulles" },
  });
  if (!devoirNote) {
    devoirNote = await prisma.exercice.create({
      data: {
        coursId: cours2.id,
        titre: "Exercice noté : tri à bulles",
        consigne: "Implémente et teste le tri à bulles sur une liste de 10 nombres.",
        type: "DEVOIR_PDF",
        points: 20,
        ordre: 1,
        dateLimite: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const soumissionExistante = await prisma.soumission.findFirst({
    where: { exerciceId: devoirNote.id, eleveId: eleveDemo.id },
  });
  if (!soumissionExistante) {
    await prisma.soumission.create({
      data: {
        exerciceId: devoirNote.id,
        eleveId: eleveDemo.id,
        contenu: "def tri_a_bulles(liste):\n    ...",
        reussi: true,
        note: 17,
        feedback: "Bon travail, la logique est correcte. Attention à bien tester les cas limites (liste vide).",
        corrigeManuellement: true,
      },
    });
  }

  // ── Quiz : deux quiz, scores variés ─────────────────────────────────
  let quiz1 = await prisma.quiz.findFirst({ where: { titre: "Quiz démo : bases de Python" } });
  if (!quiz1) {
    quiz1 = await prisma.quiz.create({
      data: {
        titre: "Quiz démo : bases de Python",
        niveau: "PREMIERE",
        matiere: "NSI",
        chapitre: 1,
        visibleEleves: true,
        auteurId: profDemo.id,
        questions: {
          create: [
            { enonce: "Quelle fonction affiche du texte en Python ?", choixA: "print()", choixB: "echo()", choixC: "afficher()", choixD: "log()", bonneReponse: 0, ordre: 1 },
            { enonce: "Comment déclare-t-on une variable en Python ?", choixA: "var x = 1", choixB: "x = 1", choixC: "int x = 1", choixD: "let x = 1", bonneReponse: 1, ordre: 2 },
            { enonce: "Quel symbole commence un commentaire ?", choixA: "//", choixB: "<!--", choixC: "#", choixD: "/*", bonneReponse: 2, ordre: 3 },
            { enonce: "Que renvoie type(3.14) ?", choixA: "int", choixB: "str", choixC: "bool", choixD: "float", bonneReponse: 3, ordre: 4 },
          ],
        },
      },
    });
  }

  let quiz2 = await prisma.quiz.findFirst({ where: { titre: "Quiz démo : algorithmique" } });
  if (!quiz2) {
    quiz2 = await prisma.quiz.create({
      data: {
        titre: "Quiz démo : algorithmique",
        niveau: "PREMIERE",
        matiere: "NSI",
        chapitre: 2,
        visibleEleves: true,
        auteurId: profDemo.id,
        questions: {
          create: [
            { enonce: "Le tri à bulles compare...", choixA: "des éléments au hasard", choixB: "des éléments voisins", choixC: "seulement le premier et le dernier", choixD: "rien du tout", bonneReponse: 1, ordre: 1 },
            { enonce: "Une boucle 'for i in range(5)' s'exécute...", choixA: "4 fois", choixB: "5 fois", choixC: "6 fois", choixD: "indéfiniment", bonneReponse: 1, ordre: 2 },
            { enonce: "Un algorithme est...", choixA: "un langage de programmation", choixB: "une suite d'étapes pour résoudre un problème", choixC: "un ordinateur", choixD: "un type de variable", bonneReponse: 1, ordre: 3 },
          ],
        },
      },
    });
  }

  async function creerTentative(quizId: string, score: number, bonnesReponses: number, total: number) {
    const dejaJoue = await prisma.tentativeQuiz.findFirst({ where: { quizId, eleveId: eleveDemo.id } });
    if (dejaJoue) return;
    await prisma.tentativeQuiz.create({
      data: {
        quizId,
        eleveId: eleveDemo.id,
        score,
        bonnesReponses,
        serieActuelle: 0,
        serieMax: Math.min(bonnesReponses, total),
      },
    });
  }
  await creerTentative(quiz1.id, 340, 3, 4);
  await creerTentative(quiz2.id, 210, 2, 3);

  // ── Suivi "vie de classe" : de quoi débloquer un palier avancé ──────
  const entreesExistantes = await prisma.entreeSuivi.count({ where: { eleveId: eleveDemo.id } });
  if (entreesExistantes === 0) {
    const etoiles = [
      [5, 5, 4], [4, 5, 5], [5, 4, 5], [4, 4, 4], [5, 5, 5],
      [3, 4, 4], [5, 5, 4], [4, 5, 5], [5, 4, 4], [4, 4, 5],
      [5, 5, 5], [4, 4, 4],
    ];
    for (let i = 0; i < etoiles.length; i++) {
      const [travailFait, assiduite, comportement] = etoiles[i];
      const date = new Date();
      date.setDate(date.getDate() - (etoiles.length - i) * 7);
      await prisma.entreeSuivi.create({
        data: {
          eleveId: eleveDemo.id,
          classeId: classe.id,
          date,
          travailFait,
          assiduite,
          comportement,
        },
      });
    }
  }

  // ── Comptes-rendus : un noté, un en attente (pour le prof démo) ────
  const crExistants = await prisma.compteRendu.count({ where: { eleveId: eleveDemo.id } });
  if (crExistants === 0) {
    await prisma.compteRendu.create({
      data: {
        coursId: cours1.id,
        noms: "Démo Élève",
        eleveId: eleveDemo.id,
        classeId: classe.id,
        noteEtoiles: 4,
        dateDepot: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.compteRendu.create({
      data: {
        coursId: cours2.id,
        noms: "Démo Élève",
        eleveId: eleveDemo.id,
        classeId: classe.id,
        noteEtoiles: null,
        dateDepot: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ── Notification de démo ────────────────────────────────────────────
  const notifExistante = await prisma.notification.findFirst({
    where: { destinataireId: eleveDemo.id, message: { contains: "compte-rendu" } },
  });
  if (!notifExistante) {
    await prisma.notification.create({
      data: {
        destinataireId: eleveDemo.id,
        message: "Ton compte-rendu sur « Découverte de Python » a été noté : 4/5 ⭐",
        matiere: "NSI",
        type: "NOTE",
        lu: false,
      },
    });
  }

  console.log("Classe démo :", classe.nom, "-", classe.codeInscription);
  console.log("Élève démo :", eleveDemo.email);
  console.log("Prof démo  :", profDemo.email);
  console.log("Cours démo :", cours1.titre, "/", cours2.titre);
  console.log("Quiz démo  :", quiz1.titre, "/", quiz2.titre);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
