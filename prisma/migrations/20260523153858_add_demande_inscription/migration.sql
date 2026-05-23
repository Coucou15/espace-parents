-- CreateTable
CREATE TABLE "DemandeInscription" (
    "id" TEXT NOT NULL,
    "parentPrenom" TEXT NOT NULL,
    "parentNom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "motDePasseHash" TEXT NOT NULL,
    "enfants" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandeInscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DemandeInscription_email_key" ON "DemandeInscription"("email");
