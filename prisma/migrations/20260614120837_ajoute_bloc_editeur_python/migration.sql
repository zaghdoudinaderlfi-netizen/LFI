-- AlterEnum
ALTER TYPE "TypeBloc" ADD VALUE 'EDITEUR_PYTHON';

-- AlterTable
ALTER TABLE "Bloc" ADD COLUMN     "codeDepart" TEXT;
