-- CreateTable
CREATE TABLE "CycleTrimestre" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "cloture" BOOLEAN NOT NULL DEFAULT false,
    "dateCloture" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CycleTrimestre_pkey" PRIMARY KEY ("id")
);
