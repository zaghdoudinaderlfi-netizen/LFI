import { Paperclip } from "lucide-react";
import { ApercuFichier } from "@/components/apercu-fichier";

type Piece = {
  id: string;
  nom: string;
  taille: number;
  typeMime: string;
};

export function PiecesJointesListe({ pieces }: { pieces: Piece[] }) {
  if (pieces.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-4">
      <p className="flex items-center gap-1.5 text-sm font-medium text-ink-primary">
        <Paperclip className="h-4 w-4 text-neon-cyan" />
        Pièces jointes
      </p>
      <ul className="flex flex-col gap-3">
        {pieces.map((piece) => (
          <li key={piece.id}>
            <ApercuFichier
              nom={piece.nom}
              taille={piece.taille}
              typeMime={piece.typeMime}
              urlBase={`/api/fichiers/${piece.id}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
