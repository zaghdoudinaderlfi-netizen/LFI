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
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user;
      const { pathname } = nextUrl;

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
      return session;
    },
  },
} satisfies NextAuthConfig;
