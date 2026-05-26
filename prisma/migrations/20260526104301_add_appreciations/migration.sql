-- CreateTable
CREATE TABLE "Appreciation" (
    "id" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "enseignantNom" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "enfantPrenom" TEXT NOT NULL,
    "matiere" TEXT,
    "type" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appreciation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appreciation_enfantId_createdAt_idx" ON "Appreciation"("enfantId", "createdAt");

-- CreateIndex
CREATE INDEX "Appreciation_enseignantId_createdAt_idx" ON "Appreciation"("enseignantId", "createdAt");
