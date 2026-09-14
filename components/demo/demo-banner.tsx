import { Clapperboard, LogOut } from "lucide-react";

export function DemoBanner() {
  return (
    <div
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-center text-sm font-medium"
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
        <button
          type="submit"
          className="text-accent-fg inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-sm transition-transform hover:scale-105 active:scale-95"
          style={{ background: "rgb(var(--neon-violet))" }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Quitter la démo
        </button>
      </form>
    </div>
  );
}
