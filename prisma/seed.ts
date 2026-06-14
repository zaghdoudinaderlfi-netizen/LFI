import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const profEmail = process.env.SEED_PROF_EMAIL;
  const profPassword = process.env.SEED_PROF_PASSWORD;
  const profNom = process.env.SEED_PROF_NOM ?? "Professeur";

  if (!profEmail || !profPassword) {
    throw new Error(
      "SEED_PROF_EMAIL et SEED_PROF_PASSWORD doivent être définis dans .env"
    );
  }

  const motDePasseHash = await bcrypt.hash(profPassword, 10);

  const prof = await prisma.user.upsert({
    where: { email: profEmail },
    update: {},
    create: {
      email: profEmail,
      nom: profNom,
      motDePasse: motDePasseHash,
      role: "PROF",
    },
  });

  const classe = await prisma.classe.upsert({
    where: { codeInscription: "DEMO2026" },
    update: {},
    create: {
      nom: "Classe de démonstration",
      niveau: "TROISIEME",
      codeInscription: "DEMO2026",
      anneeScolaire: "2025-2026",
    },
  });

  const coursDemo = await prisma.cours.upsert({
    where: { slug: "les-reseaux-informatiques" },
    update: {},
    create: {
      titre: "Les réseaux informatiques",
      slug: "les-reseaux-informatiques",
      niveau: "TROISIEME",
      matiere: "TECHNOLOGIE",
      publie: true,
      ordre: 1,
      contenu: COURS_DEMO_CONTENU,
    },
  });

  console.log("Compte PROF :", prof.email);
  console.log("Classe de démo :", classe.nom, "- code:", classe.codeInscription);
  console.log("Cours de démo :", coursDemo.titre, "(publié:", coursDemo.publie + ")");
}

const COURS_DEMO_CONTENU = `# Les réseaux informatiques

Un **réseau informatique** permet à plusieurs appareils (ordinateurs, tablettes, smartphones) de communiquer entre eux et d'échanger des données.

## Les types de réseaux

- **LAN** (Local Area Network) : un réseau local, par exemple le réseau de ton collège.
- **WAN** (Wide Area Network) : un réseau étendu, comme Internet.

## L'adresse IP

Chaque appareil connecté à un réseau possède une adresse IP, un identifiant unique qui permet de le localiser.

Une adresse IPv4 est composée de quatre nombres compris entre 0 et 255, séparés par des points. Par exemple : 192.168.1.10

## Activité pratique

Sur ton ordinateur, ouvre une invite de commandes et tape la commande suivante pour afficher ton adresse IP.

Sous Windows :

\`\`\`bash
ipconfig
\`\`\`

Sous macOS ou Linux :

\`\`\`bash
ifconfig
\`\`\`

## À retenir

1. Un réseau relie plusieurs appareils entre eux.
2. Internet est le plus grand réseau du monde : c'est un WAN.
3. Chaque appareil possède une adresse IP unique sur le réseau.
`;

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
