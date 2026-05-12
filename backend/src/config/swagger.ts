import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Cabinets Médicaux API",
      version: "2.0.0",
      description:
        "API REST pour la gestion des cabinets médicaux — patients, rendez-vous, consultations, prescriptions, stock.",
      contact: { name: "Équipe Cabinets Médicaux" },
    },
    servers: [
      { url: "http://localhost:3001", description: "Développement" },
      { url: "http://localhost:3000", description: "Développement (alt)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT : Authorization: Bearer <token>",
        },
      },
      schemas: {
        // ── Erreurs ──────────────────────────────────────────────
        Error: {
          type: "object",
          properties: { error: { type: "string", example: "Message d'erreur" } },
        },

        // ── Auth ─────────────────────────────────────────────────
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "medecin@cabinet.fr" },
            password: { type: "string", format: "password", example: "MotDePasse123!" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            role: { type: "string", enum: ["ADMIN", "MEDECIN", "SECRETAIRE"], example: "MEDECIN" },
          },
        },
        RefreshRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: { refreshToken: { type: "string" } },
        },

        // ── Patient ───────────────────────────────────────────────
        PatientCreate: {
          type: "object",
          required: ["numeroDossier", "nom", "prenom", "dateNaissance", "sexe", "nni"],
          properties: {
            numeroDossier: { type: "string", example: "PAT-2026-001" },
            nom: { type: "string", example: "Dupont" },
            prenom: { type: "string", example: "Jean" },
            dateNaissance: { type: "string", format: "date-time", example: "1985-06-15T00:00:00.000Z" },
            sexe: { type: "string", enum: ["M", "F"], example: "M" },
            nni: { type: "string", example: "1234567890123" },
            telephone: { type: "string", example: "+22212345678" },
            email: { type: "string", format: "email", example: "jean.dupont@example.com" },
            adresse: { type: "string", example: "12 rue Principale, Nouakchott" },
            groupeSanguin: { type: "string", example: "A+" },
            antecedents: { type: "string", example: "Diabète type 2" },
            allergies: { type: "string", example: "Pénicilline" },
          },
        },
        Patient: {
          type: "object",
          properties: {
            id: { type: "string", example: "clxyz123" },
            numeroDossier: { type: "string" },
            nom: { type: "string" },
            prenom: { type: "string" },
            dateNaissance: { type: "string", format: "date-time" },
            sexe: { type: "string", enum: ["M", "F"] },
            nni: { type: "string" },
            telephone: { type: "string", nullable: true },
            email: { type: "string", nullable: true },
            adresse: { type: "string", nullable: true },
            groupeSanguin: { type: "string", nullable: true },
            antecedents: { type: "string", nullable: true },
            allergies: { type: "string", nullable: true },
            deletedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ── Rendez-vous ───────────────────────────────────────────
        RendezVousCreate: {
          type: "object",
          required: ["patientId", "medecinId", "dateHeure"],
          properties: {
            patientId: { type: "string", example: "clxyz123" },
            medecinId: { type: "string", example: "clxyz456" },
            dateHeure: { type: "string", format: "date-time", example: "2026-05-20T09:00:00.000Z" },
            duree: { type: "integer", description: "Durée en minutes (défaut: 30)", example: 30 },
            motif: { type: "string", example: "Consultation générale" },
            notes: { type: "string", example: "Patient à jeun" },
          },
        },
        UpdateStatutRDV: {
          type: "object",
          required: ["statut"],
          properties: {
            statut: {
              type: "string",
              enum: ["PLANIFIE", "CONFIRME", "EN_COURS", "TERMINE", "ANNULE", "ABSENT"],
              example: "CONFIRME",
            },
          },
        },
        RendezVous: {
          type: "object",
          properties: {
            id: { type: "string" },
            patientId: { type: "string" },
            medecinId: { type: "string" },
            dateHeure: { type: "string", format: "date-time" },
            duree: { type: "integer" },
            motif: { type: "string", nullable: true },
            notes: { type: "string", nullable: true },
            statut: { type: "string", enum: ["PLANIFIE", "CONFIRME", "EN_COURS", "TERMINE", "ANNULE", "ABSENT"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ── Consultation ──────────────────────────────────────────
        ConsultationCreate: {
          type: "object",
          required: ["rdvId", "patientId", "medecinId", "motif"],
          properties: {
            rdvId: { type: "string", example: "clxyz789" },
            patientId: { type: "string", example: "clxyz123" },
            medecinId: { type: "string", example: "clxyz456" },
            motif: { type: "string", example: "Fièvre persistante" },
            symptomes: { type: "string", example: "Fièvre 39°C, maux de gorge" },
            diagnostic: { type: "string", example: "Angine bactérienne" },
            traitement: { type: "string", example: "Amoxicilline 1g 3x/jour" },
            tensionArterielle: { type: "string", example: "12/8" },
            poids: { type: "number", example: 72.5 },
            temperature: { type: "number", example: 38.9 },
            notes: { type: "string", example: "Patient sensible aux pénicillines" },
          },
        },
        Consultation: {
          type: "object",
          properties: {
            id: { type: "string" },
            rdvId: { type: "string" },
            patientId: { type: "string" },
            medecinId: { type: "string" },
            motif: { type: "string" },
            symptomes: { type: "string", nullable: true },
            diagnostic: { type: "string", nullable: true },
            traitement: { type: "string", nullable: true },
            tensionArterielle: { type: "string", nullable: true },
            poids: { type: "number", nullable: true },
            temperature: { type: "number", nullable: true },
            notes: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ── Prescription ──────────────────────────────────────────
        PrescriptionItemInput: {
          type: "object",
          required: ["medicamentId", "posologie", "duree", "quantite"],
          properties: {
            medicamentId: { type: "string", example: "clxyzabc" },
            posologie: { type: "string", example: "1 comprimé matin et soir" },
            duree: { type: "string", example: "7 jours" },
            quantite: { type: "integer", example: 14 },
          },
        },
        PrescriptionCreate: {
          type: "object",
          required: ["consultationId", "items"],
          properties: {
            consultationId: { type: "string", example: "clxyz789" },
            notes: { type: "string", example: "À prendre avec de l'eau" },
            items: {
              type: "array",
              minItems: 1,
              items: { $ref: "#/components/schemas/PrescriptionItemInput" },
            },
          },
        },
        PrescriptionItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            medicamentId: { type: "string" },
            posologie: { type: "string" },
            duree: { type: "string" },
            quantite: { type: "integer" },
            medicament: { $ref: "#/components/schemas/Medicament" },
          },
        },
        Prescription: {
          type: "object",
          properties: {
            id: { type: "string" },
            consultationId: { type: "string" },
            notes: { type: "string", nullable: true },
            items: { type: "array", items: { $ref: "#/components/schemas/PrescriptionItem" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ── Stock / Médicament ────────────────────────────────────
        MedicamentCreate: {
          type: "object",
          required: ["nom"],
          properties: {
            nom: { type: "string", example: "Amoxicilline 500mg" },
            forme: { type: "string", example: "Gélule" },
            dosage: { type: "string", example: "500mg" },
            stockActuel: { type: "integer", example: 100 },
            seuilAlerte: { type: "integer", example: 10 },
            dateExpiration: { type: "string", format: "date", example: "2027-12-31" },
          },
        },
        UpdateStock: {
          type: "object",
          required: ["quantite", "type"],
          properties: {
            quantite: { type: "integer", minimum: 1, example: 50 },
            type: { type: "string", enum: ["ENTREE", "SORTIE"], example: "ENTREE" },
            motif: { type: "string", example: "Réapprovisionnement fournisseur" },
          },
        },
        Medicament: {
          type: "object",
          properties: {
            id: { type: "string" },
            nom: { type: "string" },
            forme: { type: "string", nullable: true },
            dosage: { type: "string", nullable: true },
            stockActuel: { type: "integer" },
            seuilAlerte: { type: "integer", nullable: true },
            dateExpiration: { type: "string", format: "date", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },

    paths: {
      // ── Health ────────────────────────────────────────────────
      "/api/health": {
        get: {
          tags: ["Système"],
          summary: "Health check",
          operationId: "healthCheck",
          responses: {
            200: { description: "API opérationnelle" },
          },
        },
      },
      "/api/readiness": {
        get: {
          tags: ["Système"],
          summary: "Readiness — base de données & Redis",
          operationId: "readinessCheck",
          responses: {
            200: { description: "Tous les services opérationnels" },
            503: { description: "Un service indisponible" },
          },
        },
      },

      // ── Auth ──────────────────────────────────────────────────
      "/api/auth/login": {
        post: {
          tags: ["Authentification"],
          summary: "Connexion",
          operationId: "login",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } },
          responses: {
            200: { description: "Tokens retournés", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } } },
            400: { description: "Email ou mot de passe manquant / invalide", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Identifiants incorrects ou compte inactif" },
            429: { description: "Trop de tentatives (rate limiter)" },
          },
        },
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Authentification"],
          summary: "Rafraîchir le token d'accès",
          operationId: "refreshToken",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshRequest" } } } },
          responses: {
            200: { description: "Nouveau accessToken", content: { "application/json": { schema: { type: "object", properties: { accessToken: { type: "string" } } } } } },
            400: { description: "refreshToken manquant" },
            401: { description: "Token invalide ou révoqué" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Authentification"],
          summary: "Déconnexion",
          operationId: "logout",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Déconnexion réussie" },
            401: { description: "Non authentifié" },
          },
        },
      },

      // ── Patients ──────────────────────────────────────────────
      "/api/patients": {
        post: {
          tags: ["Patients"],
          summary: "Créer un patient",
          operationId: "createPatient",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PatientCreate" } } } },
          responses: {
            201: { description: "Patient créé", content: { "application/json": { schema: { $ref: "#/components/schemas/Patient" } } } },
            400: { description: "Données invalides", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Non authentifié" },
            409: { description: "NNI ou numéro de dossier déjà existant" },
          },
        },
        get: {
          tags: ["Patients"],
          summary: "Lister tous les patients (hors archivés)",
          operationId: "getAllPatients",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Liste des patients", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Patient" } } } } },
            401: { description: "Non authentifié" },
          },
        },
      },
      "/api/patients/{id}": {
        get: {
          tags: ["Patients"],
          summary: "Récupérer un patient par ID",
          operationId: "getPatient",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Patient trouvé", content: { "application/json": { schema: { $ref: "#/components/schemas/Patient" } } } },
            401: { description: "Non authentifié" },
            404: { description: "Patient non trouvé" },
          },
        },
        patch: {
          tags: ["Patients"],
          summary: "Mettre à jour un patient",
          operationId: "updatePatient",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PatientCreate" } } } },
          responses: {
            200: { description: "Patient mis à jour", content: { "application/json": { schema: { $ref: "#/components/schemas/Patient" } } } },
            401: { description: "Non authentifié" },
            404: { description: "Patient non trouvé" },
          },
        },
        delete: {
          tags: ["Patients"],
          summary: "Archiver un patient (soft delete)",
          operationId: "deletePatient",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Patient archivé", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
            401: { description: "Non authentifié" },
            404: { description: "Patient non trouvé" },
          },
        },
      },

      // ── Rendez-vous ───────────────────────────────────────────
      "/api/rendezvous": {
        post: {
          tags: ["Rendez-vous"],
          summary: "Créer un rendez-vous",
          operationId: "createRendezVous",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RendezVousCreate" } } } },
          responses: {
            201: { description: "RDV créé", content: { "application/json": { schema: { $ref: "#/components/schemas/RendezVous" } } } },
            400: { description: "Données invalides" },
            401: { description: "Non authentifié" },
            409: { description: "Conflit d'horaire — créneau déjà occupé pour ce médecin" },
          },
        },
        get: {
          tags: ["Rendez-vous"],
          summary: "Lister les rendez-vous",
          operationId: "getAllRendezVous",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "patientId", in: "query", schema: { type: "string" }, description: "Filtrer par patient" },
            { name: "medecinId", in: "query", schema: { type: "string" }, description: "Filtrer par médecin" },
          ],
          responses: {
            200: { description: "Liste des RDV", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/RendezVous" } } } } },
            401: { description: "Non authentifié" },
          },
        },
      },
      "/api/rendezvous/{id}": {
        get: {
          tags: ["Rendez-vous"],
          summary: "Récupérer un rendez-vous par ID",
          operationId: "getRendezVous",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "RDV trouvé avec patient + médecin", content: { "application/json": { schema: { $ref: "#/components/schemas/RendezVous" } } } },
            401: { description: "Non authentifié" },
            404: { description: "RDV non trouvé" },
          },
        },
      },
      "/api/rendezvous/{id}/statut": {
        patch: {
          tags: ["Rendez-vous"],
          summary: "Mettre à jour le statut d'un RDV",
          operationId: "updateStatutRDV",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateStatutRDV" } } } },
          responses: {
            200: { description: "Statut mis à jour", content: { "application/json": { schema: { $ref: "#/components/schemas/RendezVous" } } } },
            400: { description: "Statut invalide" },
            401: { description: "Non authentifié" },
            404: { description: "RDV non trouvé" },
          },
        },
      },

      // ── Consultations ─────────────────────────────────────────
      "/api/consultations": {
        post: {
          tags: ["Consultations"],
          summary: "Créer une consultation (clôture le RDV → TERMINE)",
          operationId: "createConsultation",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ConsultationCreate" } } } },
          responses: {
            201: { description: "Consultation créée", content: { "application/json": { schema: { $ref: "#/components/schemas/Consultation" } } } },
            400: { description: "Données invalides" },
            401: { description: "Non authentifié" },
            404: { description: "Rendez-vous non trouvé" },
          },
        },
      },
      "/api/consultations/{id}": {
        get: {
          tags: ["Consultations"],
          summary: "Récupérer une consultation par ID",
          operationId: "getConsultation",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Consultation avec patient, médecin et prescriptions", content: { "application/json": { schema: { $ref: "#/components/schemas/Consultation" } } } },
            401: { description: "Non authentifié" },
            404: { description: "Consultation non trouvée" },
          },
        },
      },

      // ── Prescriptions ─────────────────────────────────────────
      "/api/prescriptions": {
        post: {
          tags: ["Prescriptions"],
          summary: "Créer une prescription (décrémente le stock)",
          operationId: "createPrescription",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PrescriptionCreate" } } } },
          responses: {
            201: { description: "Prescription créée avec ses items", content: { "application/json": { schema: { $ref: "#/components/schemas/Prescription" } } } },
            400: { description: "Stock insuffisant ou données invalides", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Non authentifié" },
          },
        },
      },
      "/api/prescriptions/consultation/{consultationId}": {
        get: {
          tags: ["Prescriptions"],
          summary: "Lister les prescriptions d'une consultation",
          operationId: "getPrescriptionsByConsultation",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "consultationId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Liste des prescriptions", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Prescription" } } } } },
            401: { description: "Non authentifié" },
          },
        },
      },
      "/api/prescriptions/{id}": {
        get: {
          tags: ["Prescriptions"],
          summary: "Récupérer une prescription par ID",
          operationId: "getPrescription",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Prescription avec items et médicaments", content: { "application/json": { schema: { $ref: "#/components/schemas/Prescription" } } } },
            401: { description: "Non authentifié" },
            404: { description: "Prescription non trouvée" },
          },
        },
      },

      // ── Stock ─────────────────────────────────────────────────
      "/api/stock/medicaments": {
        post: {
          tags: ["Stock"],
          summary: "Ajouter un médicament au stock",
          operationId: "createMedicament",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MedicamentCreate" } } } },
          responses: {
            201: { description: "Médicament créé", content: { "application/json": { schema: { $ref: "#/components/schemas/Medicament" } } } },
            400: { description: "Nom manquant", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Non authentifié" },
          },
        },
        get: {
          tags: ["Stock"],
          summary: "Lister tous les médicaments",
          operationId: "getAllMedicaments",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Liste des médicaments", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Medicament" } } } } },
            401: { description: "Non authentifié" },
          },
        },
      },
      "/api/stock/medicaments/{id}": {
        get: {
          tags: ["Stock"],
          summary: "Récupérer un médicament par ID",
          operationId: "getMedicament",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Médicament trouvé", content: { "application/json": { schema: { $ref: "#/components/schemas/Medicament" } } } },
            401: { description: "Non authentifié" },
            404: { description: "Médicament non trouvé" },
          },
        },
      },
      "/api/stock/medicaments/{id}/stock": {
        patch: {
          tags: ["Stock"],
          summary: "Mouvement de stock (entrée ou sortie)",
          operationId: "updateStock",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateStock" } } } },
          responses: {
            200: { description: "Stock mis à jour", content: { "application/json": { schema: { $ref: "#/components/schemas/Medicament" } } } },
            400: { description: "Stock insuffisant ou données invalides" },
            401: { description: "Non authentifié" },
            404: { description: "Médicament non trouvé" },
          },
        },
      },
    },

    tags: [
      { name: "Système", description: "Health check et readiness" },
      { name: "Authentification", description: "Login, refresh et logout" },
      { name: "Patients", description: "Gestion des patients" },
      { name: "Rendez-vous", description: "Gestion des rendez-vous" },
      { name: "Consultations", description: "Gestion des consultations médicales" },
      { name: "Prescriptions", description: "Gestion des prescriptions" },
      { name: "Stock", description: "Gestion du stock de médicaments" },
    ],
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
