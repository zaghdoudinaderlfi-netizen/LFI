-- AlterTable
ALTER TABLE "User" ADD COLUMN     "doitChangerMdp" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TokenReinitMdp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "utilise" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenReinitMdp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenReinitMdp_token_key" ON "TokenReinitMdp"("token");

-- CreateIndex
CREATE INDEX "TokenReinitMdp_userId_idx" ON "TokenReinitMdp"("userId");

-- AddForeignKey
ALTER TABLE "TokenReinitMdp" ADD CONSTRAINT "TokenReinitMdp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
