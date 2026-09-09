import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";
import { adresseIpAppelant, compteurActuel, enregistrerEchec, reinitialiserCompteur } from "./lib/limite-acces";

// Deux seuils distincts, parce que les deux clés n'ont pas le même sens.
//
// L'email désigne UN compte : 5 échecs y sont le vrai garde-fou contre la
// force brute.
//
// L'IP, elle, est PARTAGÉE : au collège comme au lycée, une classe entière
// sort derrière le même NAT avec une seule adresse publique. Au même seuil
// que l'email, cinq fautes de frappe dans la salle verrouillaient tout
// l'établissement pendant 15 minutes. Le seuil IP reste donc un filet contre
// le balayage massif de comptes, pas une limite qu'un usage normal atteint.
const MAX_TENTATIVES_EMAIL = 5;
const MAX_TENTATIVES_IP = 40;
const FENETRE_BLOCAGE_MS = 15 * 60 * 1000;

// Hash bcrypt d'un mot de passe qui n'existe pas, comparé quand le compte
// n'existe pas (ou est bloqué) : sans ça, l'absence de compte renvoie plus
// vite qu'un mauvais mot de passe (pas de bcrypt.compare), ce qui permet de
// deviner quels comptes existent par le temps de réponse, même si le
// message d'erreur est identique.
const HASH_FICTIF = "$2b$10$MbQC0R8eqkGgMtz3dt/oCO0Qvh9MpXxyKN253Co9oZ1T0pvpeBhru";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const emailNettoye = email.trim();
        const ip = await adresseIpAppelant();
        const cleEmail = `connexion-echec:email:${emailNettoye}`;
        const cleIp = `connexion-echec:ip:${ip}`;

        const [echecsEmail, echecsIp] = await Promise.all([
          compteurActuel(cleEmail),
          compteurActuel(cleIp),
        ]);

        // Bloqué : on compare quand même contre le hash factice pour garder
        // un temps de réponse comparable à une tentative normale.
        if (echecsEmail >= MAX_TENTATIVES_EMAIL || echecsIp >= MAX_TENTATIVES_IP) {
          await bcrypt.compare(password, HASH_FICTIF);
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: emailNettoye } });
        const valid = await bcrypt.compare(password, user?.motDePasse ?? HASH_FICTIF);

        if (!user || !valid) {
          await Promise.all([
            enregistrerEchec(cleEmail, FENETRE_BLOCAGE_MS),
            enregistrerEchec(cleIp, FENETRE_BLOCAGE_MS),
          ]);
          return null;
        }

        // Les DEUX compteurs sont remis à zéro : ne vider que celui de l'email
        // laissait le compteur IP grimper pendant toute la fenêtre, même quand
        // les connexions réussissaient — les échecs d'une salle finissaient par
        // s'additionner jusqu'au blocage sans qu'aucune attaque n'ait eu lieu.
        await Promise.all([reinitialiserCompteur(cleEmail), reinitialiserCompteur(cleIp)]);

        return {
          id: user.id,
          email: user.email,
          name: user.nom,
          role: user.role,
          doitChangerMdp: user.doitChangerMdp,
        };
      },
    }),
  ],
});
