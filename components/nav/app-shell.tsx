"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  ListChecks,
  Award,
  Gamepad2,
  Bell,
  User,
  ClipboardCheck,
  Users,
  UserCog,
  Download,
  Menu,
  X,
  LogOut,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/actions";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { PageTransition } from "@/components/ui/page-transition";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { formaterNomComplet } from "@/lib/utilisateurs";

type Role = "ELEVE" | "PROF";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type ShellUser = {
  id: string;
  nom: string;
  prenom?: string | null;
  avatarStyle?: string | null;
  avatarOptions?: unknown;
};

const NAV_ITEMS: Record<Role, NavItem[]> = {
  ELEVE: [
    { href: "/eleve", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/eleve/cours", label: "Mes cours", icon: BookOpen },
    { href: "/eleve/travail", label: "Travail à faire", icon: ListChecks },
    { href: "/eleve/notes", label: "Mes notes", icon: Award },
    { href: "/eleve/quiz", label: "Quiz", icon: Gamepad2 },
    { href: "/eleve/logiciels", label: "Logiciels", icon: Download },
    { href: "/eleve/notifications", label: "Notifications", icon: Bell },
    { href: "/eleve/profil", label: "Profil", icon: User },
  ],
  PROF: [
    { href: "/prof", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/prof/cours", label: "Mes cours", icon: BookOpen },
    { href: "/prof/devoirs", label: "Devoirs & corrections", icon: ClipboardCheck },
    { href: "/prof/classes", label: "Mes classes", icon: Users },
    { href: "/prof/admin", label: "Gestion élèves", icon: UserCog },
    { href: "/prof/quiz", label: "Quiz", icon: Gamepad2 },
    { href: "/prof/logiciels", label: "Logiciels", icon: Download },
    { href: "/prof/notifications", label: "Notifications", icon: Bell },
    { href: "/prof/profil", label: "Profil", icon: User },
  ],
};

const DASHBOARD_HREF: Record<Role, string> = {
  ELEVE: "/eleve",
  PROF: "/prof",
};

const NOTIFICATIONS_HREF: Record<Role, string> = {
  ELEVE: "/eleve/notifications",
  PROF: "/prof/notifications",
};

const PROFIL_HREF: Record<Role, string> = {
  ELEVE: "/eleve/profil",
  PROF: "/prof/profil",
};

export function AppShell({
  role,
  user,
  notificationsNonLues,
  children,
}: {
  role: Role;
  user: ShellUser;
  notificationsNonLues: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [userMenuOuvert, setUserMenuOuvert] = useState(false);

  const items = NAV_ITEMS[role];
  const dashboardHref = DASHBOARD_HREF[role];
  const notificationsHref = NOTIFICATIONS_HREF[role];
  const profilHref = PROFIL_HREF[role];
  const userName = formaterNomComplet(user);

  function estActif(href: string) {
    if (href === dashboardHref) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function Logo() {
    return (
      <Link href={dashboardHref} className="flex items-center">
        <img src="/nadtech-logo.svg" alt="Nadtech" className="h-12 w-auto" />
      </Link>
    );
  }

  function NotificationBadge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
      <span className="badge animate-pop-in bg-neon-pink text-accent-fg shadow-[0_0_10px_rgba(244,114,182,0.6)]">
        {count > 99 ? "99+" : count}
      </span>
    );
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const actif = estActif(item.href);
          const badge = item.href === notificationsHref ? notificationsNonLues : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={actif ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                actif
                  ? "bg-gradient-to-r from-neon-blue/15 to-neon-violet/15 text-ink-primary shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]"
                  : "text-ink-secondary hover:bg-space-surface2 hover:text-ink-primary"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${actif ? "text-neon-cyan" : ""}`} />
              <span className="flex-1">{item.label}</span>
              <NotificationBadge count={badge} />
            </Link>
          );
        })}
      </nav>
    );
  }

  function UserMenu({ compact = false }: { compact?: boolean }) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => { setUserMenuOuvert((o) => !o); setMenuOuvert(false); }}
          className={`flex items-center gap-2 rounded-lg text-sm font-medium text-ink-primary transition-colors hover:bg-space-surface2 ${
            compact ? "p-1" : "w-full px-2 py-1.5"
          }`}
          aria-label="Menu utilisateur"
          aria-expanded={userMenuOuvert}
        >
          <AvatarDisplay user={user} neutre={role === "PROF"} taille={compact ? "xs" : "sm"} />
          {!compact && (
            <>
              <span className="flex-1 truncate text-left">{userName}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ${
                  userMenuOuvert ? "rotate-180" : ""
                }`}
              />
            </>
          )}
        </button>

        {userMenuOuvert && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setUserMenuOuvert(false)}
            />
            <div className="absolute left-0 z-50 mt-1 w-48 rounded-xl border border-space-border bg-space-deep p-1 shadow-xl">
              <Link
                href={profilHref}
                onClick={() => setUserMenuOuvert(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-space-surface2 hover:text-ink-primary"
              >
                <User className="h-4 w-4" />
                Mon profil
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-space-surface2 hover:text-ink-primary"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* Menu latéral (écrans larges) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-space-border lg:bg-space-surface/60 lg:backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between border-b border-space-border px-6">
          <Logo />
          <ThemeToggle />
        </div>
        {/* Menu utilisateur en haut à gauche */}
        <div className="border-b border-space-border px-3 py-2">
          <UserMenu />
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <NavLinks />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Barre supérieure (mobile / tablette) */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-space-border bg-space-surface/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          {/* Gauche : avatar utilisateur + logo */}
          <div className="flex items-center gap-2">
            <UserMenu compact />
            <Logo />
          </div>
          {/* Droite : notifications + menu */}
          <div className="flex items-center gap-2">
            <Link
              href={notificationsHref}
              className="relative rounded-lg p-2 text-ink-secondary transition-colors hover:bg-space-surface2 hover:text-ink-primary"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationsNonLues > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 animate-pop-in items-center justify-center rounded-full bg-neon-pink px-1 text-[10px] font-bold text-accent-fg shadow-[0_0_10px_rgba(244,114,182,0.6)]">
                  {notificationsNonLues > 99 ? "99+" : notificationsNonLues}
                </span>
              )}
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => { setMenuOuvert(true); setUserMenuOuvert(false); }}
              className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-space-surface2 hover:text-ink-primary"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Menu mobile (volet) */}
        {menuOuvert && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMenuOuvert(false)}
            />
            <div className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-space-border bg-space-deep p-4 shadow-2xl animate-fade-in-up">
              <div className="mb-4 flex items-center justify-between">
                <Logo />
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <button
                    type="button"
                    onClick={() => setMenuOuvert(false)}
                    className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-space-surface2 hover:text-ink-primary"
                    aria-label="Fermer le menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavLinks onNavigate={() => setMenuOuvert(false)} />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
