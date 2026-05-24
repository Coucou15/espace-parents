-- CreateTable
CREATE TABLE "MessageContact" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "parentPrenom" TEXT NOT NULL,
    "parentNom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "traite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageContact_pkey" PRIMARY KEY ("id")
);
