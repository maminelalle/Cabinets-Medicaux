import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import bcrypt from "bcrypt";
import request from "supertest";

import app from "../app";
import { prisma } from "../prisma/client";

import { cleanupDatabase } from "./cleanup";

describe("TÂCHE 3 — Tests intégration prescriptions + stock", () => {
  let accessToken: string;
  let consultationId: string;
  let medicamentId: string;

  beforeAll(async () => {
    // Nettoyage
    await cleanupDatabase();

    // Setup Auth & Medecin & Patient & Consultation
    const hashedPassword = await bcrypt.hash("Password123!", 12);
    await prisma.compte.create({
      data: {
        email: "admin@cabinet.com",
        motDePasse: hashedPassword,
        role: "ADMIN",
        statut: "ACTIF",
      },
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@cabinet.com", password: "Password123!" });
    accessToken = loginRes.body.accessToken;

    const patient = await prisma.patient.create({
      data: {
        numeroDossier: "PAT-T3-001",
        nom: "Doe",
        prenom: "Jane",
        dateNaissance: new Date("1995-05-05"),
        sexe: "F",
        nni: "1234567890888",
      },
    });

    const medecinCompte = await prisma.compte.create({
      data: {
        email: "doc@test.com",
        motDePasse: hashedPassword,
        role: "MEDECIN",
        statut: "ACTIF",
      },
    });

    const medecin = await prisma.medecin.create({
      data: {
        compteId: medecinCompte.id,
        nom: "Dupont",
        prenom: "Jean",
        specialite: "Généraliste",
      },
    });

    const rdv = await prisma.rendezVous.create({
      data: {
        patientId: patient.id,
        medecinId: medecin.id,
        dateHeure: new Date(),
        motif: "Test Prescription",
      },
    });

    const consultation = await prisma.consultation.create({
      data: {
        rdvId: rdv.id,
        patientId: patient.id,
        medecinId: medecin.id,
        motif: "Test Prescription",
      },
    });
    consultationId = consultation.id;

    // Création médicament
    const medicament = await prisma.medicament.create({
      data: {
        nom: "Paracétamol 500mg",
        forme: "Comprimé",
        stockActuel: 100,
        seuilAlerte: 10,
      },
    });
    medicamentId = medicament.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Prescriptions & Stock", () => {
    it("creation prescription avec items — vérifier 201 et liens", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          consultationId,
          items: [
            {
              medicamentId,
              posologie: "1 matin, 1 soir",
              duree: "5 jours",
              quantite: 10,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].medicamentId).toBe(medicamentId);
    });

    it("decrementation stock — vérifier que le stock a diminué (90)", async () => {
      const res = await request(app)
        .get(`/api/stock/medicaments/${medicamentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stockActuel).toBe(90);
    });

    it("stock insuffisant — tenter de prescrire 100 alors qu'il reste 90 (400)", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          consultationId,
          items: [
            {
              medicamentId,
              posologie: "1 matin",
              duree: "100 jours",
              quantite: 100,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Stock insuffisant");
    });
  });
});
