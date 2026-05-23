# Espace Parents — Les Racines du Future

Application web pour les parents d'élèves de l'école « Les Racines du Future »,
prototype répondant au cahier des charges de mai 2026.

## Stack technique

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** pour le style
- **Prisma 7** + **PostgreSQL** pour la base de données
- **bcryptjs** pour le hash des mots de passe
- **web-push** pour les notifications push réelles
- Mobile-first, identité visuelle vert / bleu / ocre

## Fonctionnalités

**Côté parent** (mobile, 384 px max)

- Inscription multi-enfants avec sélection palier → niveau (FR + DZ) → section
- Connexion sécurisée + mot de passe oublié
- Tableau d'affichage des annonces
- Menu de la cantine (2 semaines)
- Évaluations par enfant avec moyenne automatique
- Emploi du temps personnel selon classe
- Galerie photos
- Règlement intérieur avec recherche
- Contact + déconnexion
- **Notifications push** activables depuis le profil

**Côté admin** (`/admin`, desktop)

- Tableau de bord + statistiques
- Validation des demandes d'inscription
- Gestion des comptes parents
- CRUD annonces (envoi auto de notification push)
- Édition des emplois du temps par classe
- Saisie des évaluations
- Édition du menu cantine
- Upload de photos dans la galerie
- Édition du règlement intérieur
- Boîte des messages parents

## Lancement local

### Prérequis

- Node.js 20+
- Une base PostgreSQL accessible
  - Soit en local (Docker, installation native)
  - Soit en cloud sur [Neon](https://neon.tech) (gratuit)

### Étapes

1. Cloner le dépôt et installer les dépendances :

   ```bash
   git clone <url>
   cd espace-parents
   npm install
   ```

2. Copier `.env` et remplir `DATABASE_URL` avec votre chaîne PostgreSQL :

   ```
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
   VAPID_PRIVATE_KEY="..."
   VAPID_SUBJECT="mailto:contact@racinesdufutur.dz"
   ```

   Pour générer des clés VAPID :

   ```bash
   npx web-push generate-vapid-keys --json
   ```

3. Créer les tables et peupler les données démo :

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. Lancer le serveur de dev :

   ```bash
   npm run dev
   ```

   L'app est sur <http://localhost:3000>.

### Comptes démo

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| Parent | demo@parent.fr | Demo2026! |
| Super-admin | directeur@racinesdufutur.dz | Admin2026! |
| Admin école | secretariat@racinesdufutur.dz | Secret2026! |

## Déploiement sur Vercel

1. **Pousser le code sur GitHub**

   ```bash
   git add .
   git commit -m "Premier commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE-USER/espace-parents.git
   git push -u origin main
   ```

2. **Créer un projet Vercel**
   - Aller sur <https://vercel.com/new>
   - « Import » le dépôt GitHub
   - Vercel détecte Next.js automatiquement, **ne pas changer les paramètres de build**

3. **Ajouter une base PostgreSQL**
   - Dans le projet Vercel : onglet **Storage** → **Create Database** → **Postgres**
   - Vercel injecte automatiquement `DATABASE_URL` dans les variables d'environnement

4. **Ajouter les variables VAPID**
   - Onglet **Settings** → **Environment Variables**
   - Ajouter :
     - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (clé publique)
     - `VAPID_PRIVATE_KEY` (clé privée)
     - `VAPID_SUBJECT` (`mailto:contact@racinesdufutur.dz`)

5. **Appliquer les migrations sur la base de production**

   Récupérer l'URL Postgres dans Vercel (Storage → Postgres → `.env.local`),
   puis localement :

   ```bash
   DATABASE_URL="<url-production-vercel>" npm run db:deploy
   DATABASE_URL="<url-production-vercel>" npm run db:seed
   ```

6. **Déployer**
   - Vercel relance automatiquement le build avec les nouvelles variables
   - HTTPS automatique → notifications push fonctionnelles 🎉

## Structure du projet

```
app/
├── (parent)/        # Application mobile parents
├── admin/           # Back-office desktop
├── api/             # Routes serveur (auth, store, push)
├── components/      # Composants partagés
├── lib/             # Helpers, hooks, store, db, authServer
└── generated/prisma/  # Code généré par Prisma (gitignoré)
prisma/
├── schema.prisma    # Modèle de données
├── migrations/      # Historique des migrations
└── seed.ts          # Script de peuplement
public/
├── sw.js            # Service Worker pour les push
└── logo.jpg
```

## Sécurité

- Mots de passe **hachés bcrypt** (cost 10)
- Sessions **server-side** avec cookie HTTP-only
- Routes admin protégées par rôle (parent/admin-ecole/super-admin/enseignant/cantine)
- Notifications push signées avec clés VAPID
- HTTPS obligatoire en production (assuré par Vercel)

## Limites connues du prototype

- Pas d'inscription auto réelle (`/inscription` simule l'envoi, la validation reste manuelle côté admin)
- Pas de ciblage des notifications par classe / palier (toutes les notifs vont à tous les abonnés)
- Pas d'envoi d'e-mail (le flow « mot de passe oublié » simule le clic sur le lien)
- iOS Safari ne reçoit les push que si l'app est installée comme PWA (limite Apple, pas du code)
- Photos uploadées stockées en base64 dans la DB — à migrer vers un stockage objet (S3, Vercel Blob) pour les gros volumes

## Pistes d'évolution

- Multilingue FR / AR avec sens d'écriture droite-à-gauche
- Migration des photos vers Vercel Blob ou S3
- Ciblage des notifications par classe
- Application native iOS / Android via Capacitor ou React Native
- Module évolutif : paiement de la cantine, messagerie privée parent-enseignant
