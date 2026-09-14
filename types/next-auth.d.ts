import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    doitChangerMdp: boolean;
    /** Compte de démonstration publique (voir lib/demo-constants.ts) — accès lecture seule. */
    isDemo?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      doitChangerMdp: boolean;
      isDemo: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    doitChangerMdp: boolean;
    isDemo: boolean;
  }
}
