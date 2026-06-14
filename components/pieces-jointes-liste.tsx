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
    <div className="mb-6 flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-700">Pièces jointes</p>
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
