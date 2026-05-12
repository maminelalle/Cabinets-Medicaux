import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import bcrypt from "bcrypt";
import request from "supertest";

import app from "../app";
import { prisma } from "../prisma/client";

import { cleanupDatabase } from "./cleanup";

describe("TÂCHE 2 — Tests intégration rendez-vous + consultations", () => {
  let accessToken: string;
  let patientId: string;
  let medecinId: string;
  let rendezvousId: string;
  let consultationId: string;

  const rdvDate = new Date();
  rdvDate.setHours(rdvDate.getHours() + 48);
  rdvDate.setMinutes(0, 0, 0);

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

    const medecinCompte = await prisma.compte.create({
      data: { email: "medecin@test.com", motDePasse: hashedPassword, role: "MEDECIN", statut: "ACTIF" },
    });
    const medecin = await prisma.medecin.create({
      data: { compteId: medecinCompte.id, nom: "Dupont", prenom: "Jean", specialite: "Généraliste" },
    });
    medecinId = medecin.id;

    const patient = await prisma.patient.create({
      data: { numeroDossier: "PAT-T2-001", nom: "Doe", prenom: "Jane", dateNaissance: new Date("1995-05-05"), sexe: "F", nni: "1234567890999" },
    });
    patientId = patient.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ── RENDEZ-VOUS ─────────────────────────────────────────────────────────────

  describe("Rendez-vous — cas nominaux", () => {
    it("création rendez-vous valide — 201 + id retourné", async () => {
      const res = await request(app)
        .post("/api/rendezvous")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ patientId, medecinId, dateHeure: rdvDate.toISOString(), motif: "Consultation de routine" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.statut).toBe("PLANIFIE");
      rendezvousId = res.body.id;
    });

    it("get rendez-vous par ID — 200 avec patient + médecin", async () => {
      const res = await request(app)
        .get(`/api/rendezvous/${rendezvousId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.patient).toBeDefined();
      expect(res.body.medecin).toBeDefined();
    });

    it("liste des rendez-vous — tableau non vide (200)", async () => {
      const res = await request(app)
        .get("/api/rendezvous")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it("liste filtrée par médecin — retourne uniquement ses RDV", async () => {
      const res = await request(app)
        .get(`/api/rendezvous?medecinId=${medecinId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((r: { medecinId: string }) => r.medecinId === medecinId)).toBe(true);
    });

    it("update statut CONFIRME — 200 + statut mis à jour", async () => {
      const res = await request(app)
        .patch(`/api/rendezvous/${rendezvousId}/statut`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ statut: "CONFIRME" });

      expect(res.status).toBe(200);
      expect(res.body.statut).toBe("CONFIRME");
    });
  });

  describe("Rendez-vous — cas limites et erreurs métier", () => {
    it("conflit horaire — même médecin même créneau → 409", async () => {
      const res = await request(app)
        .post("/api/rendezvous")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ patientId, medecinId, dateHeure: rdvDate.toISOString(), motif: "Conflit" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Conflit d'horaire");
    });

    it("création RDV — champs requis manquants → 400", async () => {
      const res = await request(app)
        .post("/api/rendezvous")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ motif: "Manque patientId et medecinId" });

      expect(res.status).toBe(400);
    });

    it("get RDV — ID inexistant → 404", async () => {
      const res = await request(app)
        .get("/api/rendezvous/id-inexistant-99999")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("update statut — statut invalide → 400", async () => {
      const res = await request(app)
        .patch(`/api/rendezvous/${rendezvousId}/statut`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ statut: "INVALIDE" });

      expect(res.status).toBe(400);
    });

    it("update statut — ID inexistant → 404", async () => {
      const res = await request(app)
        .patch("/api/rendezvous/id-inexistant/statut")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ statut: "ANNULE" });

      expect(res.status).toBe(404);
    });

    it("accès sans JWT — 401", async () => {
      const res = await request(app).get("/api/rendezvous");
      expect(res.status).toBe(401);
    });
  });

  // ── CONSULTATIONS ───────────────────────────────────────────────────────────

  describe("Consultations — cas nominaux", () => {
    it("création consultation depuis RDV — 201", async () => {
      const res = await request(app)
        .post("/api/consultations")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          rdvId: rendezvousId,
          patientId,
          medecinId,
          motif: "Consultation de routine",
          diagnostic: "Tout va bien",
          symptomes: "Aucun",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      consultationId = res.body.id;
    });

    it("statut RDV après consultation — TERMINE", async () => {
      const res = await request(app)
        .get(`/api/rendezvous/${rendezvousId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.statut).toBe("TERMINE");
    });

    it("get consultation par ID — 200 avec patient + médecin + prescriptions", async () => {
      const res = await request(app)
        .get(`/api/consultations/${consultationId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.patient).toBeDefined();
      expect(res.body.medecin).toBeDefined();
      expect(Array.isArray(res.body.prescriptions)).toBe(true);
    });
  });

  describe("Consultations — cas limites et erreurs métier", () => {
    it("création consultation — rdvId inexistant → 404", async () => {
      const res = await request(app)
        .post("/api/consultations")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ rdvId: "rdv-inexistant-123", patientId, medecinId, motif: "Test" });

      expect(res.status).toBe(404);
    });

    it("création consultation — motif manquant → 400", async () => {
      const res = await request(app)
        .post("/api/consultations")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ rdvId: rendezvousId, patientId, medecinId });

      expect(res.status).toBe(400);
    });

    it("get consultation — ID inexistant → 404", async () => {
      const res = await request(app)
        .get("/api/consultations/id-inexistant-12345")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });
});
