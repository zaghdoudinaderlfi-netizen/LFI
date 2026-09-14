import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

export const authConfig = {
  pages: {
    signIn: "/connexion",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const user = auth?.user;
      const { nextUrl } = request;
      const { pathname } = nextUrl;

      // Filet de sécurité serveur (démo publique en lecture seule) : toute
      // Server Action (mutation) est bloquée ici, avant même d'atteindre le
      // handler, quelle que soit la route — voir prisma/seed-demo.ts pour
      // l'origine des comptes isDemo. Next.js envoie l'en-tête "next-action"
      // pour distinguer un appel de Server Action d'une navigation normale.
      if (user?.isDemo && request.headers.get("next-action")) {
        return NextResponse.json(
          { error: "Fonctionnalité désactivée en mode démonstration." },
          { status: 403 }
        );
      }

      // /prof/admin liste tous les vrais élèves (nom, email, classe) et
      // permet de réinitialiser leur mot de passe : un compte démo ne doit
      // jamais pouvoir y accéder, même pour lire, contrairement au reste du
      // tableau de bord prof (filtré à la "Classe Démo" dans les requêtes
      // elles-mêmes — voir lib/classes.ts et lib/comptes-rendus.ts).
      if (user?.isDemo && pathname.startsWith("/prof/admin")) {
        return NextResponse.redirect(new URL("/prof", nextUrl));
      }

      const isProfRoute = pathname.startsWith("/prof");
      const isEleveRoute = pathname.startsWith("/eleve");

      if (!isProfRoute && !isEleveRoute) return true;

      if (!user) return false;

      if (isProfRoute && user.role !== "PROF") {
        return NextResponse.redirect(new URL("/eleve", nextUrl));
      }

      if (isEleveRoute && user.role !== "ELEVE") {
        return NextResponse.redirect(new URL("/prof", nextUrl));
      }

      // Forcer le changement de mot de passe temporaire avant tout accès
      if (isEleveRoute && user.doitChangerMdp && pathname !== "/eleve/profil") {
        return NextResponse.redirect(new URL("/eleve/profil", nextUrl));
      }

      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.doitChangerMdp = user.doitChangerMdp ?? false;
        token.isDemo = user.isDemo ?? false;
      }
      // Mise à jour du token après un changement de mot de passe côté client
      if (trigger === "update" && typeof session?.doitChangerMdp === "boolean") {
        token.doitChangerMdp = session.doitChangerMdp;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.doitChangerMdp = token.doitChangerMdp ?? false;
      session.user.isDemo = token.isDemo ?? false;
      return session;
    },
  },
} satisfies NextAuthConfig;
