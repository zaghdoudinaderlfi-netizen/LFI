import { Clapperboard } from "lucide-react";

export function DemoBanner() {
  return (
    <div
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm font-medium"
      style={{
        background: "rgba(var(--neon-violet), 0.16)",
        borderBottom: "1px solid rgba(var(--neon-violet), 0.4)",
        color: "rgb(var(--neon-violet))",
      }}
    >
      <span className="inline-flex items-center gap-1.5">
        <Clapperboard className="h-4 w-4" />
        Mode démonstration — données d&apos;exemple, aucune modification n&apos;est enregistrée
      </span>
      <form action="/api/demo/quitter" method="post">
        <button type="submit" className="underline underline-offset-2 hover:no-underline">
          Quitter la démo
        </button>
      </form>
    </div>
  );
}
