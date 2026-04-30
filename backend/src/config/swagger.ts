import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Cabinets Médicaux API",
      version: "1.0.0",
      description:
        "Documentation de l'API REST pour la gestion des cabinets médicaux (patients, rendez-vous, consultations, prescriptions, stock).",
      contact: {
        name: "Équipe Cabinets Médicaux",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Serveur de développement",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Entrez votre token JWT : Bearer <token>",
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "medecin@cabinet.fr" },
            password: { type: "string", format: "password", example: "motdepasse123" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          },
        },
        RefreshRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          },
        },
        // ── Patient ───────────────────────────────────────────
        PatientCreate: {
          type: "object",
          required: ["nom", "prenom", "dateNaissance"],
          properties: {
            nom: { type: "string", example: "Dupont" },
            prenom: { type: "string", example: "Jean" },
            dateNaissance: { type: "string", format: "date", example: "1985-06-15" },
            telephone: { type: "string", example: "+33612345678" },
            email: { type: "string", format: "email", example: "jean.dupont@example.com" },
            adresse: { type: "string", example: "12 rue de la Paix, 75001 Paris" },
          },
        },
        Patient: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
            nom: { type: "string", example: "Dupont" },
            prenom: { type: "string", example: "Jean" },
            dateNaissance: { type: "string", format: "date", example: "1985-06-15" },
            telephone: { type: "string", example: "+33612345678" },
            email: { type: "string", format: "email", example: "jean.dupont@example.com" },
            adresse: { type: "string", example: "12 rue de la Paix, 75001 Paris" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        // ── Rendez-vous ───────────────────────────────────────
        RendezVousCreate: {
          type: "object",
          required: ["patientId", "medecinId", "dateHeure", "duree"],
          properties: {
            patientId: { type: "string", format: "uuid", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
            medecinId: { type: "string", format: "uuid", example: "b2c3d4e5-f6a7-8901-bcde-f12345678901" },
            dateHeure: { type: "string", format: "date-time", example: "2026-05-10T09:00:00.000Z" },
            duree: { type: "integer", description: "Durée en minutes", example: 30 },
            motif: { type: "string", example: "Consultation générale" },
          },
        },
        RendezVous: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            patientId: { type: "string", format: "uuid" },
            medecinId: { type: "string", format: "uuid" },
            dateHeure: { type: "string", format: "date-time" },
            duree: { type: "integer" },
            motif: { type: "string" },
            statut: { type: "string", enum: ["PLANIFIE", "ANNULE", "TERMINE"], example: "PLANIFIE" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── Consultation ──────────────────────────────────────
        ConsultationCreate: {
          type: "object",
          required: ["rdvId", "patientId", "medecinId", "motif"],
          properties: {
            rdvId: { type: "string", format: "uuid", example: "c3d4e5f6-a7b8-9012-cdef-123456789012" },
            patientId: { type: "string", format: "uuid", example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
            medecinId: { type: "string", format: "uuid", example: "b2c3d4e5-f6a7-8901-bcde-f12345678901" },
            motif: { type: "string", example: "Fièvre persistante" },
            symptomes: { type: "string", example: "Fièvre 39°C, maux de gorge" },
            diagnostic: { type: "string", example: "Angine bactérienne" },
            traitement: { type: "string", example: "Amoxicilline 1g 3x/jour pendant 7 jours" },
          },
        },
        Consultation: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            rdvId: { type: "string", format: "uuid" },
            patientId: { type: "string", format: "uuid" },
            medecinId: { type: "string", format: "uuid" },
            motif: { type: "string" },
            symptomes: { type: "string", nullable: true },
            diagnostic: { type: "string", nullable: true },
            traitement: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── Prescription ──────────────────────────────────────
        PrescriptionCreate: {
          type: "object",
          required: ["consultationId", "medicamentId", "posologie", "quantite"],
          properties: {
            consultationId: { type: "string", format: "uuid", example: "d4e5f6a7-b8c9-0123-defa-234567890123" },
            medicamentId: { type: "string", format: "uuid", example: "e5f6a7b8-c9d0-1234-efab-345678901234" },
            posologie: { type: "string", example: "1 comprimé matin et soir" },
            quantite: { type: "integer", example: 14 },
            duree: { type: "string", example: "7 jours" },
          },
        },
        Prescription: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            consultationId: { type: "string", format: "uuid" },
            medicamentId: { type: "string", format: "uuid" },
            posologie: { type: "string" },
            quantite: { type: "integer" },
            duree: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── Stock / Médicament ────────────────────────────────
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
        Medicament: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
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
        // ── Erreurs ───────────────────────────────────────────
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Message d'erreur" },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            message: { type: "string", example: "Email et mot de passe requis" },
          },
        },
      },
    },
    paths: {
      // ── Health ────────────────────────────────────────────
      "/api/health": {
        get: {
          tags: ["Système"],
          summary: "Vérification de santé de l'API",
          operationId: "healthCheck",
          responses: {
            200: {
              description: "API opérationnelle",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      timestamp: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/readiness": {
        get: {
          tags: ["Système"],
          summary: "Vérification de disponibilité (base de données & Redis)",
          operationId: "readinessCheck",
          responses: {
            200: {
              description: "Tous les services sont opérationnels",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      timestamp: { type: "string", format: "date-time" },
                      checks: {
                        type: "object",
                        properties: {
                          database: { type: "string", example: "up" },
                          redis: { type: "string", example: "up" },
                        },
                      },
                    },
                  },
                },
              },
            },
            503: { description: "Un ou plusieurs services sont indisponibles" },
          },
        },
      },
      // ── Auth ──────────────────────────────────────────────
      "/api/auth/login": {
        post: {
          tags: ["Authentification"],
          summary: "Connexion d'un médecin",
          operationId: "login",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } },
            },
          },
          responses: {
            200: {
              description: "Connexion réussie — retourne access + refresh token",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } },
              },
            },
            400: { description: "Email ou mot de passe manquant", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
            401: { description: "Identifiants invalides" },
            429: { description: "Trop de tentatives — rate limiter actif" },
          },
        },
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Authentification"],
          summary: "Rafraîchissement du token d'accès",
          operationId: "refreshToken",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RefreshRequest" } },
            },
          },
          responses: {
            200: {
              description: "Nouveau access token généré",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } },
              },
            },
            400: { description: "Refresh token manquant" },
            401: { description: "Refresh token invalide ou expiré" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Authentification"],
          summary: "Déconnexion (révocation du refresh token)",
          operationId: "logout",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Déconnexion réussie",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { message: { type: "string", example: "Déconnexion réussie" } },
                  },
                },
              },
            },
            401: { description: "Non authentifié" },
          },
        },
      },
      // ── Patients ──────────────────────────────────────────
      "/api/patients": {
        post: {
          tags: ["Patients"],
          summary: "Créer un nouveau patient",
          operationId: "createPatient",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/PatientCreate" } },
            },
          },
          responses: {
            201: {
              description: "Patient créé avec succès",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Patient" } },
              },
            },
            400: { description: "Données invalides", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Non authentifié" },
          },
        },
        get: {
          tags: ["Patients"],
          summary: "Lister tous les patients",
          operationId: "getAllPatients",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Liste des patients",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Patient" } },
                },
              },
            },
            401: { description: "Non authentifié" },
            500: { description: "Erreur serveur" },
          },
        },
      },
      // ── Rendez-vous ───────────────────────────────────────
      "/api/rendezvous": {
        post: {
          tags: ["Rendez-vous"],
          summary: "Créer un rendez-vous",
          operationId: "createRendezVous",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RendezVousCreate" } },
            },
          },
          responses: {
            201: {
              description: "Rendez-vous créé",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/RendezVous" } },
              },
            },
            400: { description: "Données invalides", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Non authentifié" },
            409: { description: "Conflit d'horaire — créneau déjà occupé" },
          },
        },
      },
      "/api/rendezvous/{id}": {
        get: {
          tags: ["Rendez-vous"],
          summary: "Récupérer un rendez-vous par ID",
          operationId: "getRendezVous",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "UUID du rendez-vous",
            },
          ],
          responses: {
            200: {
              description: "Rendez-vous trouvé",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/RendezVous" } },
              },
            },
            401: { description: "Non authentifié" },
            404: { description: "Rendez-vous non trouvé" },
            500: { description: "Erreur serveur" },
          },
        },
      },
      // ── Consultations ─────────────────────────────────────
      "/api/consultations": {
        post: {
          tags: ["Consultations"],
          summary: "Créer une consultation (clôture le rendez-vous associé)",
          operationId: "createConsultation",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ConsultationCreate" } },
            },
          },
          responses: {
            201: {
              description: "Consultation créée et rendez-vous mis à jour (TERMINE)",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Consultation" } },
              },
            },
            400: { description: "Données invalides", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            401: { description: "Non authentifié" },
          },
        },
      },
      // ── Prescriptions ─────────────────────────────────────
      "/api/prescriptions": {
        post: {
          tags: ["Prescriptions"],
          summary: "Créer une prescription (décrémente le stock du médicament)",
          operationId: "createPrescription",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/PrescriptionCreate" } },
            },
          },
          responses: {
            201: {
              description: "Prescription créée",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Prescription" } },
              },
            },
            400: {
              description: "Données invalides ou stock insuffisant",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            401: { description: "Non authentifié" },
          },
        },
      },
      // ── Stock ─────────────────────────────────────────────
      "/api/stock/medicaments": {
        post: {
          tags: ["Stock"],
          summary: "Ajouter un médicament au stock",
          operationId: "createMedicament",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/MedicamentCreate" } },
            },
          },
          responses: {
            201: {
              description: "Médicament créé",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Medicament" } },
              },
            },
            400: { description: "Données invalides", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
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
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "UUID du médicament",
            },
          ],
          responses: {
            200: {
              description: "Médicament trouvé",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Medicament" } },
              },
            },
            401: { description: "Non authentifié" },
            404: { description: "Médicament non trouvé" },
            500: { description: "Erreur serveur" },
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
  apis: [], // Tout est inline ci-dessus
};

export const swaggerSpec = swaggerJsdoc(options);
