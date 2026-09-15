-- AlterEnum
BEGIN;
CREATE TYPE "TypeExercice_new" AS ENUM ('PYTHON', 'TURTLE', 'QCM', 'ARDUINO', 'CODE_OUVERT');
ALTER TABLE "Exercice" ALTER COLUMN "type" TYPE "TypeExercice_new" USING ("type"::text::"TypeExercice_new");
ALTER TYPE "TypeExercice" RENAME TO "TypeExercice_old";
ALTER TYPE "TypeExercice_new" RENAME TO "TypeExercice";
DROP TYPE "public"."TypeExercice_old";
COMMIT;

-- AlterTable
ALTER TABLE "Exercice" DROP COLUMN "modeRemise",
DROP COLUMN "sujetChemin",
DROP COLUMN "sujetNom",
DROP COLUMN "sujetTaille",
DROP COLUMN "sujetTypeMime";

-- DropEnum
DROP TYPE "ModeRemiseFormulaire";

