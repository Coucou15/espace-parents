-- AlterTable
ALTER TABLE "User" ADD COLUMN     "matiere" TEXT;

-- CreateTable
CREATE TABLE "CreneauDisponible" (
    "id" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "dateHeure" TIMESTAMP(3) NOT NULL,
    "duree" INTEGER NOT NULL DEFAULT 15,
    "pris" BOOLEAN NOT NULL DEFAULT false,
    "rdvId" TEXT,

    CONSTRAINT "CreneauDisponible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RendezVous" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "enfantId" TEXT,
    "creneauId" TEXT,
    "dateHeure" TIMESTAMP(3) NOT NULL,
    "duree" INTEGER NOT NULL DEFAULT 15,
    "motif" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'confirme',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RendezVous_pkey" PRIMARY KEY ("id")
);
