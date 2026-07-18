-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "enfantId" TEXT NOT NULL,
    "enfantPrenom" TEXT NOT NULL,
    "enfantNom" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "motif" TEXT,
    "justifiee" BOOLEAN NOT NULL DEFAULT false,
    "signaleParId" TEXT NOT NULL,
    "signaleParNom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Absence_enfantId_date_idx" ON "Absence"("enfantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Absence_enfantId_date_periode_key" ON "Absence"("enfantId", "date", "periode");
