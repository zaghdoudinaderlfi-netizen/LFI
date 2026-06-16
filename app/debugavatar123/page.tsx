import { AVATAR_STYLES, configAvatarParDefaut } from "@/lib/avatar";
import { AvatarBuilder } from "@/components/avatar/avatar-builder";

export default function DebugAvatarPage() {
  return (
    <div className="flex flex-col gap-12 p-6">
      {AVATAR_STYLES.map((s) => (
        <div key={s.id}>
          <h2 className="mb-4 text-xl font-bold text-white">{s.label} ({s.id})</h2>
          <AvatarBuilder seed="eleve-test" configInitiale={configAvatarParDefaut(s.id)} />
        </div>
      ))}
    </div>
  );
}
