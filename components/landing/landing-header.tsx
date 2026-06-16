"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV_LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#a-propos", label: "À propos" },
];

export function LandingHeader() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-space-border bg-space-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <img src="/nadtech-logo.svg" alt="Nadtech" className="h-12 w-auto" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="link-muted text-sm font-medium">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Link href="/connexion" className="btn-secondary">
            Se connecter
          </Link>
          <Link href="/inscription" className="btn-primary">
            S&apos;inscrire
          </Link>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-space-surface2 hover:text-ink-primary"
            aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={ouvert}
          >
            {ouvert ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {ouvert && (
        <div className="border-t border-space-border bg-space-surface/95 px-4 py-4 backdrop-blur-xl animate-fade-in-up lg:hidden sm:px-6">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOuvert(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-space-surface2 hover:text-ink-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/connexion" className="btn-secondary w-full" onClick={() => setOuvert(false)}>
              Se connecter
            </Link>
            <Link href="/inscription" className="btn-primary w-full" onClick={() => setOuvert(false)}>
              S&apos;inscrire
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
