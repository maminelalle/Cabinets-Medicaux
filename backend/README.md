# Backend - Cabinets Médicaux

## Setup
### Prérequis
- **Node.js** : v24.11.1 (ou version stable récente)
- **PostgreSQL** : Instance accessible (locale ou cloud comme Supabase)
- **Redis** : Utilisé pour la gestion des sessions (Refresh Tokens)

### Installation
1. Cloner le dépôt.
2. Installer les dépendances depuis la racine ou le dossier backend :
   ```bash
   npm install
   ```
3. Configurer les variables d'environnement (voir section Environment).

## Environment
Créer un fichier `.env` dans le dossier `backend` avec les variables suivantes :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:pass@host:port/db` |
| `REDIS_URL` | URL de connexion Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Secret pour les Access Tokens | `votre_secret_32_chars` |
| `JWT_EXPIRES_IN` | Durée de validité des Access Tokens | `15m` |
| `REFRESH_TOKEN_SECRET` | Secret pour les Refresh Tokens | `votre_autre_secret` |
| `REFRESH_TOKEN_EXPIRES_IN` | Durée de validité des Refresh Tokens | `7d` |
| `PORT` | Port d'écoute du serveur | `3001` |
| `NODE_ENV` | Environnement (development/production) | `development` |
| `FRONTEND_URL` | URL du frontend pour CORS | `http://localhost:5173` |

## Run
### Développement
Lance le serveur avec rechargement automatique :
```bash
npm run dev --workspace=backend
```

### Production
Compile et lance le serveur en mode production :
```bash
npm run build --workspace=backend
npm run start --workspace=backend
```

## Seed
Pour initialiser la base de données avec des comptes de test (Admin, Médecin) et un patient :
```bash
npx prisma db seed
```
*Note : Assurez-vous que les migrations ont été appliquées avant de seeder.*

## Tests
### Tests Unitaires et Intégration
Les tests sont gérés par Jest et s'exécutent de manière séquentielle pour éviter les conflits de base de données :
```bash
npm run test --workspace=backend
```

### Linting
```bash
npm run lint --workspace=backend
```

## Troubleshooting
- **Prisma Engine Type** : Si vous rencontrez des erreurs de type `engineType`, le projet utilise actuellement `@prisma/adapter-pg` pour une meilleure compatibilité sur Windows.
- **Redis Connection** : Si Redis est indisponible, le serveur démarrera mais les fonctionnalités de refresh token seront limitées. Le point de terminaison `/api/readiness` affichera alors `fallback memoire actif`.
- **Port déjà utilisé** : Si le port 3001 est occupé, modifiez la variable `PORT` dans le fichier `.env`.

## Migrations Prisma
### Baseline actuel
La structure actuelle est définie dans `prisma/schema.prisma`. Pour synchroniser votre base locale :
```bash
npx prisma migrate dev --name init
```

### Créer une nouvelle migration
Après avoir modifié le schéma :
```bash
npx prisma migrate dev --name description_de_votre_changement
```

### Appliquer les migrations en production
```bash
npx prisma migrate deploy
```
