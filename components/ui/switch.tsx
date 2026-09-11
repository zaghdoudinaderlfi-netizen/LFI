/**
 * Interrupteur on/off réutilisable — même style visuel que les switchs déjà
 * utilisés dans app/prof/cours/cours-form.tsx (création d'un cours), mais
 * factorisé ici pour être aussi utilisable sur les toggles de la liste des
 * cours (correction/dépôt) qui, eux, appellent une Server Action au clic.
 */
export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-gradient-to-r from-neon-blue to-neon-violet" : "bg-space-border"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
