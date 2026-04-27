# Avancement general + taches semaine (27-04-2026)

## 1. Avancement general du projet

- Branche `feature/backend-init` de Mariem recuperee et mergee sur `main`.
- Merge pousse sur GitHub: commit `f5c1008`.
- Backend valide apres merge:
- `npm run lint --workspace=backend` OK.
- `npm run build --workspace=backend` OK.
- Base Supabase deja connectee et operationnelle via pooler.
- Modules backend deja en place et actifs: auth, patients, medecins, rendez-vous, consultations, prescriptions.
- Ajouts recuperes de la branche Mariem: fichiers de tests backend, module stock, docs backend.

## 2. Taches Lalle (cette semaine)

- Finaliser les pages frontend restantes: medicaments, dossiers, rapports, admin users, settings.
- Brancher les pages frontend restantes aux vraies APIs backend.
- Ajouter gestion d'erreurs UI uniforme (toasts/messages + etats de chargement).
- Verifier les parcours complets de bout en bout (auth -> CRUD -> rapports).
- Ajouter screenshots portfolio des ecrans finalises dans `screenshots/`.
- Faire une passe finale QA sur desktop et mobile.
- Preparer la demo P2 (script de demo + checklist pre-demo).

## 3. Taches Mariem (cette semaine)

- Renforcer les tests backend ajoutes (cas limites + erreurs metier).
- Completer tests d'integration API pour rendez-vous, consultations, prescriptions, stock.
- Verifier/coordonner la coherence schema Prisma vs routes/services.
- Consolider la validation Zod sur toutes les routes backend restantes.
- Ajouter/mettre a jour la documentation API (endpoints, payloads, erreurs).
- Assister lalle sur les contrats API manquants pour les pages frontend restantes.
- Participer a la recette finale backend avant cloture P2.

## 4. Priorites de coordination (Lalle + Mariem)

- Priorite 1: terminer les ecrans frontend manquants et les connecter.
- Priorite 2: stabiliser les tests backend critiques.
- Priorite 3: valider ensemble un run complet demo-ready avant passage P3.
