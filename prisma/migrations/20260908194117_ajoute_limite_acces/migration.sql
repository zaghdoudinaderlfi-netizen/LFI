-- CreateTable
CREATE TABLE "LimiteAcces" (
    "cle" TEXT NOT NULL,
    "compteur" INTEGER NOT NULL DEFAULT 1,
    "expireA" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LimiteAcces_pkey" PRIMARY KEY ("cle")
);

-- CreateIndex
CREATE INDEX "LimiteAcces_expireA_idx" ON "LimiteAcces"("expireA");
