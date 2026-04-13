# Cabinets Medicaux

Application web de gestion des cabinets medicaux.

## Apercu

Le projet contient:

- un backend Node.js/Express/TypeScript avec Prisma
- un frontend React/Vite/TypeScript
- une base PostgreSQL (Supabase)

## Stack

- Frontend: React, Vite, TypeScript, Tailwind
- Backend: Express, TypeScript, Prisma
- Database: Supabase PostgreSQL
- Cache/Session: Redis (fallback memoire en dev si Redis indisponible)

## Lancer le projet en local

### 1) Installer les dependances

```bash
npm install
```

### 2) Configurer les variables d'environnement

- Copier `.env.example` vers `.env`
- Verifier aussi `backend/.env`

### 3) Lancer frontend + backend

```bash
npm run dev
```

## Liens utiles en local

- Frontend: http://localhost:5174/login
- Backend health: http://localhost:3001/api/health

## Organisation

- `frontend/`: application web
- `backend/`: API + Prisma
- `backend/prisma/`: schema, migrations, seed
- `docs/`: rapports et planification equipe
- `screenshots/`: captures ecran du projet

## Roadmap courte

- Finaliser les pages frontend restantes (medicaments, dossiers, rapports, admin, settings)
- Renforcer les tests integration backend
- Activer Redis reel pour environnement complet

## Screenshots

Les captures seront ajoutees dans le dossier `screenshots/` a la fin des modules principaux.
