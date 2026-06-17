import type { Metadata } from "next";
import { Space_Grotesk, Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nadtech — Plateforme pédagogique",
  description: "Cours, exercices interactifs et code en ligne — Technologie & SNT",
};

// Applique le thème (clair/sombre) choisi par l'utilisateur avant le premier
// rendu, pour éviter tout flash. Par défaut le site est en thème sombre
// (classe "dark" déjà présente côté serveur) : ce script ne fait que la
// retirer si l'utilisateur a explicitement choisi le thème clair.
const THEME_INIT_SCRIPT = `
try {
  if (localStorage.getItem("theme") === "light") {
    document.documentElement.classList.remove("dark");
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${nunito.variable} dark`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
