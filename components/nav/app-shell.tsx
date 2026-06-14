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
  Download,
  Menu,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/actions";

type Role = "ELEVE" | "PROF";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
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

export function AppShell({
  role,
  userName,
  notificationsNonLues,
  children,
}: {
  role: Role;
  userName: string;
  notificationsNonLues: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);

  const items = NAV_ITEMS[role];
  const dashboardHref = DASHBOARD_HREF[role];
  const notificationsHref = NOTIFICATIONS_HREF[role];

  function estActif(href: string) {
    if (href === dashboardHref) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
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
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                actif
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Menu latéral (écrans larges) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link href={dashboardHref} className="text-lg font-bold text-slate-800">
            LFI
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <NavLinks />
        </div>
        <div className="border-t border-slate-200 p-4">
          <p className="mb-2 truncate text-sm font-medium text-slate-700">
            {userName}
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Barre supérieure (mobile / tablette) */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <Link href={dashboardHref} className="text-lg font-bold text-slate-800">
            LFI
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={notificationsHref}
              className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationsNonLues > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {notificationsNonLues > 99 ? "99+" : notificationsNonLues}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMenuOuvert(true)}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
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
              className="absolute inset-0 bg-black/30"
              onClick={() => setMenuOuvert(false)}
            />
            <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white p-4 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">LFI</span>
                <button
                  type="button"
                  onClick={() => setMenuOuvert(false)}
                  className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Fermer le menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavLinks onNavigate={() => setMenuOuvert(false)} />
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="mb-2 truncate text-sm font-medium text-slate-700">
                  {userName}
                </p>
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
