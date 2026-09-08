import Link from "next/link";

export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      <Link href="/mentions-legales" className="hover:underline">
        Mentions légales
      </Link>
      <span aria-hidden className="opacity-40">
        ·
      </span>
      <Link href="/politique-confidentialite" className="hover:underline">
        Confidentialité
      </Link>
    </div>
  );
}
