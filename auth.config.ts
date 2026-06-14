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

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
