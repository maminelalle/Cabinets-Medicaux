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
  let medicamentId2: string;
  let prescriptionId: string;

  beforeAll(async () => {
    await cleanupDatabase();

    const hashedPassword = await bcrypt.hash("Password123!", 12);
    await prisma.compte.create({
      data: { email: "admin@cabinet.com", motDePasse: hashedPassword, role: "ADMIN", statut: "ACTIF" },
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@cabinet.com", password: "Password123!" });
    accessToken = loginRes.body.accessToken;

    const patient = await prisma.patient.create({
      data: { numeroDossier: "PAT-T3-001", nom: "Doe", prenom: "Jane", dateNaissance: new Date("1995-05-05"), sexe: "F", nni: "1234567890888" },
    });

    const medecinCompte = await prisma.compte.create({
      data: { email: "doc@test.com", motDePasse: hashedPassword, role: "MEDECIN", statut: "ACTIF" },
    });
    const medecin = await prisma.medecin.create({
      data: { compteId: medecinCompte.id, nom: "Dupont", prenom: "Jean", specialite: "Généraliste" },
    });

    const rdv = await prisma.rendezVous.create({
      data: { patientId: patient.id, medecinId: medecin.id, dateHeure: new Date(), motif: "Test Prescription" },
    });
    const consultation = await prisma.consultation.create({
      data: { rdvId: rdv.id, patientId: patient.id, medecinId: medecin.id, motif: "Test Prescription" },
    });
    consultationId = consultation.id;

    const medicament = await prisma.medicament.create({
      data: { nom: "Paracétamol 500mg", forme: "Comprimé", stockActuel: 100, seuilAlerte: 10 },
    });
    medicamentId = medicament.id;

    const medicament2 = await prisma.medicament.create({
      data: { nom: "Amoxicilline 500mg", forme: "Gélule", stockActuel: 5, seuilAlerte: 5 },
    });
    medicamentId2 = medicament2.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ── STOCK ────────────────────────────────────────────────────────────────────

  describe("Stock — cas nominaux", () => {
    it("liste médicaments — tableau non vide (200)", async () => {
      const res = await request(app)
        .get("/api/stock/medicaments")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it("get médicament par ID — 200", async () => {
      const res = await request(app)
        .get(`/api/stock/medicaments/${medicamentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stockActuel).toBe(100);
    });

    it("créer médicament via API — 201", async () => {
      const res = await request(app)
        .post("/api/stock/medicaments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ nom: "Ibuprofène 400mg", forme: "Comprimé", stockActuel: 50, seuilAlerte: 10 });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.nom).toBe("Ibuprofène 400mg");
    });

    it("entrée de stock (ENTREE) — stock augmenté (200)", async () => {
      const res = await request(app)
        .patch(`/api/stock/medicaments/${medicamentId2}/stock`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ quantite: 50, type: "ENTREE", motif: "Réapprovisionnement" });

      expect(res.status).toBe(200);
      expect(res.body.stockActuel).toBe(55);
    });
  });

  describe("Stock — cas limites et erreurs métier", () => {
    it("créer médicament — nom manquant → 400", async () => {
      const res = await request(app)
        .post("/api/stock/medicaments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ forme: "Comprimé", stockActuel: 50 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("get médicament — ID inexistant → 404", async () => {
      const res = await request(app)
        .get("/api/stock/medicaments/id-inexistant-123")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("update stock — type invalide → 400", async () => {
      const res = await request(app)
        .patch(`/api/stock/medicaments/${medicamentId}/stock`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ quantite: 10, type: "INVALIDE" });

      expect(res.status).toBe(400);
    });

    it("update stock — médicament inexistant → 404", async () => {
      const res = await request(app)
        .patch("/api/stock/medicaments/id-inexistant/stock")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ quantite: 10, type: "ENTREE" });

      expect(res.status).toBe(404);
    });
  });

  // ── PRESCRIPTIONS ────────────────────────────────────────────────────────────

  describe("Prescriptions — cas nominaux", () => {
    it("création prescription avec items — 201 + liens corrects", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          consultationId,
          items: [{ medicamentId, posologie: "1 matin, 1 soir", duree: "5 jours", quantite: 10 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].medicamentId).toBe(medicamentId);
      prescriptionId = res.body.id;
    });

    it("décrémentation stock — stock passé à 90", async () => {
      const res = await request(app)
        .get(`/api/stock/medicaments/${medicamentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stockActuel).toBe(90);
    });

    it("get prescription par ID — 200 avec items + médicaments", async () => {
      const res = await request(app)
        .get(`/api/prescriptions/${prescriptionId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.items[0].medicament).toBeDefined();
    });

    it("get prescriptions par consultation — liste non vide (200)", async () => {
      const res = await request(app)
        .get(`/api/prescriptions/consultation/${consultationId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Prescriptions — cas limites et erreurs métier", () => {
    it("stock insuffisant — prescrire 100 alors qu'il reste 90 → 400", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          consultationId,
          items: [{ medicamentId, posologie: "1 matin", duree: "100 jours", quantite: 100 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Stock insuffisant");
    });

    it("médicament inexistant dans prescription → 400", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          consultationId,
          items: [{ medicamentId: "med-inexistant-123", posologie: "1/j", duree: "3 jours", quantite: 5 }],
        });

      expect(res.status).toBe(400);
    });

    it("items vides — au moins un médicament requis → 400", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ consultationId, items: [] });

      expect(res.status).toBe(400);
    });

    it("quantité nulle ou négative → 400", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          consultationId,
          items: [{ medicamentId, posologie: "1/j", duree: "3 jours", quantite: 0 }],
        });

      expect(res.status).toBe(400);
    });

    it("consultationId manquant → 400", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          items: [{ medicamentId, posologie: "1/j", duree: "3 jours", quantite: 5 }],
        });

      expect(res.status).toBe(400);
    });

    it("get prescription — ID inexistant → 404", async () => {
      const res = await request(app)
        .get("/api/prescriptions/id-inexistant-999")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("prescription multi-items — stock vérifié pour chaque item", async () => {
      const res = await request(app)
        .post("/api/prescriptions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          consultationId,
          items: [
            { medicamentId, posologie: "1/j", duree: "3 jours", quantite: 5 },
            { medicamentId: medicamentId2, posologie: "2/j", duree: "3 jours", quantite: 200 }, // stock insuffisant
          ],
        });

      // La transaction doit échouer entièrement (stock medicamentId ne doit pas changer)
      expect(res.status).toBe(400);

      const stockCheck = await request(app)
        .get(`/api/stock/medicaments/${medicamentId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(stockCheck.body.stockActuel).toBe(90); // inchangé
    });
  });
});
