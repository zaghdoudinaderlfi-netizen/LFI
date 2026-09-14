import { Sparkles, type LucideIcon, Swords, Award, CalendarDays, Gamepad2, BarChart3, Bot, FileDown, MessageCircle } from "lucide-react";

type Amelioration = { icon: LucideIcon; titre: string; description: string };

const AMELIORATIONS_ELEVE: Amelioration[] = [
  { icon: Swords, titre: "Duels de quiz en direct", description: "Défie un camarade en 1 contre 1, en temps réel." },
  { icon: Award, titre: "Badges à collectionner", description: "De nouvelles récompenses, au-delà des boucliers actuels." },
  { icon: CalendarDays, titre: "Calendrier des devoirs", description: "Toutes les échéances de la semaine en un coup d'œil." },
  { icon: Gamepad2, titre: "Nouveaux mini-jeux de révision", description: "Réviser en s'amusant, matière par matière." },
];

const AMELIORATIONS_PROF: Amelioration[] = [
  { icon: BarChart3, titre: "Statistiques de classe avancées", description: "Repérer en un clic les notions mal comprises." },
  { icon: Bot, titre: "Génération de quiz assistée", description: "Créer un quiz automatiquement à partir d'un cours." },
  { icon: FileDown, titre: "Export du bulletin", description: "Un clic pour un bulletin prêt à imprimer." },
  { icon: MessageCircle, titre: "Messagerie directe", description: "Échanger avec un élève sans passer par un tiers." },
];

export function AmeliorationsFutures({ role }: { role: "ELEVE" | "PROF" }) {
  const items = role === "ELEVE" ? AMELIORATIONS_ELEVE : AMELIORATIONS_PROF;

  return (
    <section className="card-hard card-hard-violet animate-fade-in-up p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5" style={{ color: "rgb(var(--neon-violet))" }} />
        <h2 className="section-title">À venir sur la plateforme</h2>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.titre} className="item-arcade flex items-start gap-3 p-4">
            <item.icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "rgb(var(--neon-violet))" }} />
            <div>
              <p className="font-medium text-ink-primary">{item.titre}</p>
              <p className="text-sm text-ink-secondary">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
