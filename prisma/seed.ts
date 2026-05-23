/**
 * Script de seed : pré-peuple la base SQLite avec les données factices
 * actuellement utilisées par l'application.
 *
 * Lancement : `npm run db:seed`
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import {
  albums,
  annonces,
  bulletins,
  emploisDuTempsParClasse,
  menuSemaineActuelle,
  menuSemaineSuivante,
  reglement,
} from "../app/lib/mockData";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL n'est pas définie.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function upsert(name: string, value: unknown) {
  const json = JSON.stringify(value);
  await prisma.store.upsert({
    where: { name },
    create: { name, value: json },
    update: { value: json },
  });
  console.log(`  ✓ ${name} (${(json.length / 1024).toFixed(1)} Ko)`);
}

async function seedUsers() {
  console.log("👥 Seed des utilisateurs…");
  const hash = (mdp: string) => bcrypt.hash(mdp, 10);

  const utilisateurs = [
    {
      email: "demo@parent.fr",
      prenom: "Amina",
      nom: "Benali",
      motDePasse: "Demo2026!",
      role: "parent",
      telephone: "+213 6 12 34 56 78",
      codeAcces: "847219",
      enfants: [
        { prenom: "Sami", nom: "Benali", palierId: "primaire", niveauId: "ce2", section: "B" },
        { prenom: "Lina", nom: "Benali", palierId: "maternelle", niveauId: "gs", section: "A" },
        { prenom: "Yacine", nom: "Benali", palierId: "college", niveauId: "5e", section: "A" },
      ],
    },
    {
      email: "directeur@racinesdufutur.dz",
      prenom: "Mehdi",
      nom: "Ouali",
      motDePasse: "Admin2026!",
      role: "super-admin",
      telephone: null,
      codeAcces: null,
      enfants: [],
    },
    {
      email: "secretariat@racinesdufutur.dz",
      prenom: "Fatima",
      nom: "Cherif",
      motDePasse: "Secret2026!",
      role: "admin-ecole",
      telephone: null,
      codeAcces: null,
      enfants: [],
    },
    {
      email: "karim.belkadi@racinesdufutur.dz",
      prenom: "Karim",
      nom: "Belkadi",
      motDePasse: "Prof2026!",
      role: "enseignant",
      telephone: null,
      codeAcces: null,
      matiere: "Mathématiques",
      enfants: [],
    },
    {
      email: "leila.zerouali@racinesdufutur.dz",
      prenom: "Leila",
      nom: "Zerouali",
      motDePasse: "Prof2026!",
      role: "enseignant",
      telephone: null,
      codeAcces: null,
      matiere: "Français",
      enfants: [],
    },
  ];

  for (const u of utilisateurs) {
    const motDePasseHash = await hash(u.motDePasse);
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        prenom: u.prenom,
        nom: u.nom,
        motDePasseHash,
        role: u.role,
        telephone: u.telephone,
        codeAcces: u.codeAcces,
        matiere: ("matiere" in u ? (u as { matiere?: string }).matiere : null) ?? null,
        enfants: { create: u.enfants },
      },
      update: {
        motDePasseHash,
        prenom: u.prenom,
        nom: u.nom,
        role: u.role,
        telephone: u.telephone,
        codeAcces: u.codeAcces,
        matiere: ("matiere" in u ? (u as { matiere?: string }).matiere : null) ?? null,
      },
    });
    console.log(`  ✓ ${u.email} (${u.role})`);
  }
}

async function main() {
  console.log("🌱 Seed de la base de données…");
  await upsert("annonces", annonces);
  await upsert("menu", { actuelle: menuSemaineActuelle, suivante: menuSemaineSuivante });
  await upsert("albums", albums);
  await upsert("edts", emploisDuTempsParClasse);
  await upsert("bulletins", bulletins);
  await upsert("reglement", reglement);
  await seedUsers();
  console.log("✅ Seed terminé.");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
