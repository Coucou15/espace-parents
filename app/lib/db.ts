import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Initialisation paresseuse de Prisma :
// - on ne crée l'instance qu'à la première utilisation
// - permet à `next build` de réussir sur Vercel même si DATABASE_URL
//   n'est pas encore configurée
// - en dev, on garde une instance globale qui survit aux hot reloads
const globalForPrisma = globalThis as unknown as { prismaInstance?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL n'est pas définie. Configurez-la dans .env (local) " +
        "ou dans les variables d'environnement Vercel (production)."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaInstance(): PrismaClient {
  if (globalForPrisma.prismaInstance) return globalForPrisma.prismaInstance;
  const instance = createClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prismaInstance = instance;
  }
  return instance;
}

// Proxy : déclenche l'initialisation seulement quand on accède à une
// propriété (donc à la première requête, pas à l'import du module).
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getPrismaInstance();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
