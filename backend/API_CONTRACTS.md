# Contrats API — Cabinets Médicaux
> Base URL : `http://localhost:3001/api`  
> Toutes les routes (sauf login/refresh) nécessitent : `Authorization: Bearer <accessToken>`

---

## Authentification

### `POST /auth/login`
Connexion d'un utilisateur.

**Body**
```json
{ "email": "medecin@cabinet.fr", "password": "MotDePasse123!" }
```
**Réponse 200**
```json
{ "accessToken": "eyJ...", "refreshToken": "eyJ...", "role": "MEDECIN" }
```
**Erreurs**
| Code | Raison |
|------|--------|
| 400  | Email ou mot de passe manquant/format invalide |
| 401  | Identifiants incorrects ou compte INACTIF |
| 429  | Trop de tentatives (rate limiter) |

---

### `POST /auth/refresh`
Renouveler l'access token.

**Body**
```json
{ "refreshToken": "eyJ..." }
```
**Réponse 200**
```json
{ "accessToken": "eyJ..." }
```
**Erreurs** : 400 (manquant), 401 (invalide/révoqué)

---

### `POST /auth/logout` 🔒
Révoquer le refresh token.

**Réponse 200** : `{ "message": "Déconnexion réussie" }`

---

## Patients

### `POST /patients` 🔒
Créer un patient.

**Body**
```json
{
  "numeroDossier": "PAT-2026-001",
  "nom": "Dupont",
  "prenom": "Jean",
  "dateNaissance": "1985-06-15T00:00:00.000Z",
  "sexe": "M",
  "nni": "1234567890123",
  "telephone": "+22212345678",       // optionnel
  "email": "jean@example.com",       // optionnel
  "adresse": "Nouakchott",           // optionnel
  "groupeSanguin": "A+",             // optionnel
  "antecedents": "Diabète type 2",   // optionnel
  "allergies": "Pénicilline"         // optionnel
}
```
**Réponse 201** : objet `Patient`

**Erreurs** : 400 (champ requis manquant ou sexe invalide), 401, 409 (NNI ou numeroDossier dupliqué)

---

### `GET /patients` 🔒
Lister tous les patients actifs (non archivés), triés par date de création décroissante.

**Réponse 200** : `Patient[]`

---

### `GET /patients/:id` 🔒
Récupérer un patient par son ID.

**Réponse 200** : objet `Patient`  
**Erreurs** : 404 (non trouvé)

---

### `PATCH /patients/:id` 🔒
Mettre à jour partiellement un patient (tous les champs sont optionnels).

**Body** : subset de `PatientCreate`  
**Réponse 200** : objet `Patient` mis à jour  
**Erreurs** : 404 (non trouvé)

---

### `DELETE /patients/:id` 🔒
Archiver un patient (soft delete — n'apparaît plus dans la liste).

**Réponse 200** : `{ "message": "Patient archivé" }`  
**Erreurs** : 404 (non trouvé)

---

## Rendez-vous

### `POST /rendezvous` 🔒
Créer un rendez-vous. Vérifie les conflits de créneau pour le même médecin.

**Body**
```json
{
  "patientId": "clxyz123",
  "medecinId": "clxyz456",
  "dateHeure": "2026-05-20T09:00:00.000Z",
  "duree": 30,                        // optionnel, défaut 30 min
  "motif": "Consultation générale",   // optionnel
  "notes": "Patient à jeun"           // optionnel
}
```
**Réponse 201** : objet `RendezVous` avec `statut: "PLANIFIE"`

**Erreurs** : 400 (champs requis manquants), 401, 409 (conflit d'horaire)

---

### `GET /rendezvous` 🔒
Lister les rendez-vous, avec filtres optionnels.

**Query params**
- `patientId` — filtrer par patient
- `medecinId` — filtrer par médecin

**Réponse 200** : `RendezVous[]` (inclut objets `patient` et `medecin`)

---

### `GET /rendezvous/:id` 🔒
Récupérer un rendez-vous par ID (inclut patient + médecin).

**Réponse 200** : objet `RendezVous`  
**Erreurs** : 404

---

### `PATCH /rendezvous/:id/statut` 🔒
Changer le statut d'un rendez-vous.

**Body**
```json
{ "statut": "CONFIRME" }
```
Valeurs possibles : `PLANIFIE` | `CONFIRME` | `EN_COURS` | `TERMINE` | `ANNULE` | `ABSENT`

**Réponse 200** : objet `RendezVous` mis à jour  
**Erreurs** : 400 (statut invalide), 404 (RDV non trouvé)

---

## Consultations

### `POST /consultations` 🔒
Créer une consultation liée à un RDV. Met automatiquement le RDV à `TERMINE`.

**Body**
```json
{
  "rdvId": "clxyz789",
  "patientId": "clxyz123",
  "medecinId": "clxyz456",
  "motif": "Fièvre persistante",
  "symptomes": "Fièvre 39°C",         // optionnel
  "diagnostic": "Angine bactérienne", // optionnel
  "traitement": "Amoxicilline 1g",    // optionnel
  "tensionArterielle": "12/8",        // optionnel
  "poids": 72.5,                      // optionnel
  "temperature": 38.9,                // optionnel
  "notes": "Allergie pénicilline"     // optionnel
}
```
**Réponse 201** : objet `Consultation`

**Erreurs** : 400 (motif manquant), 401, 404 (rdvId introuvable)

---

### `GET /consultations/:id` 🔒
Récupérer une consultation avec patient, médecin et prescriptions associées.

**Réponse 200** : objet `Consultation` enrichi  
**Erreurs** : 404

---

## Prescriptions

### `POST /prescriptions` 🔒
Créer une prescription. Vérifie le stock de chaque médicament et décrémente atomiquement.

**Body**
```json
{
  "consultationId": "clxyz789",
  "notes": "À prendre avec de l'eau", // optionnel
  "items": [
    {
      "medicamentId": "clxyzabc",
      "posologie": "1 comprimé matin et soir",
      "duree": "7 jours",
      "quantite": 14
    }
  ]
}
```
> `items` doit contenir au moins 1 élément. `quantite` doit être un entier > 0.

**Réponse 201** : objet `Prescription` avec `items[]`

**Erreurs** : 400 (stock insuffisant, médicament inexistant, items vides, quantité ≤ 0), 401

---

### `GET /prescriptions/consultation/:consultationId` 🔒
Lister toutes les prescriptions d'une consultation (avec items et médicaments).

**Réponse 200** : `Prescription[]`

---

### `GET /prescriptions/:id` 🔒
Récupérer une prescription par ID (avec items et médicaments).

**Réponse 200** : objet `Prescription`  
**Erreurs** : 404

---

## Stock

### `POST /stock/medicaments` 🔒
Ajouter un médicament à l'inventaire.

**Body**
```json
{
  "nom": "Amoxicilline 500mg",
  "forme": "Gélule",              // optionnel
  "dosage": "500mg",              // optionnel
  "stockActuel": 100,             // optionnel, défaut 0
  "seuilAlerte": 10,              // optionnel, défaut 10
  "dateExpiration": "2027-12-31"  // optionnel
}
```
**Réponse 201** : objet `Medicament`  
**Erreurs** : 400 (nom manquant), 401

---

### `GET /stock/medicaments` 🔒
Lister tous les médicaments, triés par nom alphabétique.

**Réponse 200** : `Medicament[]`

---

### `GET /stock/medicaments/:id` 🔒
Récupérer un médicament par ID.

**Réponse 200** : objet `Medicament`  
**Erreurs** : 404

---

### `PATCH /stock/medicaments/:id/stock` 🔒
Enregistrer un mouvement de stock (entrée fournisseur ou sortie manuelle).

**Body**
```json
{
  "quantite": 50,
  "type": "ENTREE",
  "motif": "Réapprovisionnement fournisseur" // optionnel
}
```
> `type` : `ENTREE` ou `SORTIE`. Une sortie avec stock insuffisant retourne 400.

**Réponse 200** : objet `Medicament` avec `stockActuel` mis à jour  
**Erreurs** : 400 (stock insuffisant ou type invalide), 404

---

## Modèles de réponse communs

### `Patient`
```typescript
{
  id: string
  numeroDossier: string
  nom: string
  prenom: string
  dateNaissance: string      // ISO 8601
  sexe: "M" | "F"
  nni: string
  telephone?: string
  email?: string
  adresse?: string
  groupeSanguin?: string
  antecedents?: string
  allergies?: string
  deletedAt?: string         // null si actif
  createdAt: string
  updatedAt: string
}
```

### `RendezVous`
```typescript
{
  id: string
  patientId: string
  medecinId: string
  dateHeure: string          // ISO 8601
  duree: number              // minutes
  motif?: string
  notes?: string
  statut: "PLANIFIE" | "CONFIRME" | "EN_COURS" | "TERMINE" | "ANNULE" | "ABSENT"
  patient?: Patient          // présent sur GET /:id et GET /
  medecin?: object           // présent sur GET /:id et GET /
  createdAt: string
  updatedAt: string
}
```

### `Consultation`
```typescript
{
  id: string
  rdvId: string
  patientId: string
  medecinId: string
  motif: string
  symptomes?: string
  diagnostic?: string
  traitement?: string
  tensionArterielle?: string
  poids?: number
  temperature?: number
  notes?: string
  patient?: Patient          // présent sur GET /:id
  medecin?: object           // présent sur GET /:id
  prescriptions?: Prescription[] // présent sur GET /:id
  createdAt: string
  updatedAt: string
}
```

### `Prescription`
```typescript
{
  id: string
  consultationId: string
  notes?: string
  items: Array<{
    id: string
    medicamentId: string
    posologie: string
    duree: string
    quantite: number
    medicament?: Medicament  // présent sur GET
  }>
  createdAt: string
  updatedAt: string
}
```

### `Medicament`
```typescript
{
  id: string
  nom: string
  forme?: string
  dosage?: string
  stockActuel: number
  seuilAlerte: number
  dateExpiration?: string    // date ISO
  createdAt: string
  updatedAt: string
}
```

### `Error`
```json
{ "error": "Description de l'erreur" }
```

---

## Notes d'intégration frontend

1. **Stocker les tokens** : `accessToken` (mémoire/state) + `refreshToken` (localStorage ou httpOnly cookie)
2. **Intercepter les 401** : si l'access token expire, appeler `/auth/refresh` automatiquement, puis rejouer la requête
3. **Gestion des conflits RDV (409)** : afficher "Ce créneau est déjà pris pour ce médecin"
4. **Stock insuffisant (400 + `error` contient "Stock insuffisant")** : afficher le message d'erreur de la réponse
5. **Soft delete patients** : les patients archivés n'apparaissent plus dans `GET /patients` — pas besoin de filtrage côté frontend
6. **Dates** : toujours envoyer en ISO 8601 (`2026-05-20T09:00:00.000Z`), les réponses sont aussi en ISO 8601
