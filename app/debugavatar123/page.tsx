import { configAvatarParDefaut } from "@/lib/avatar";
import { AvatarBuilder } from "@/components/avatar/avatar-builder";
import { AvatarDisplay } from "@/components/avatar/avatar-display";

const SEEDS = ["eleve-test-1", "eleve-test-2", "prof-test-1"];

export default function DebugAvatarPage() {
  return (
    <div className="flex flex-col gap-12 p-6">
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">Constructeur Avataaars</h2>
        <AvatarBuilder
          seed="eleve-test"
          configInitiale={configAvatarParDefaut("avataaars")}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-white">
          AvatarDisplay — seeds différents
        </h2>
        <div className="flex flex-wrap gap-6">
          {SEEDS.map((seed) => (
            <div key={seed} className="flex flex-col items-center gap-2">
              <AvatarDisplay user={{ id: seed, avatarStyle: null }} taille="xl" />
              <p className="text-xs text-ink-muted">{seed}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
