import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import bcrypt from "bcrypt";
import request from "supertest";

import app from "../app";
import { prisma } from "../prisma/client";

import { cleanupDatabase } from "./cleanup";

describe("TÂCHE 1 — Tests intégration auth + patients", () => {
  let accessToken: string;
  let refreshToken: string;
  let patientId: string;

  beforeAll(async () => {
    await cleanupDatabase();

    const hashedPassword = await bcrypt.hash("Password123!", 12);
    await prisma.compte.create({
      data: { email: "test@cabinet.com", motDePasse: hashedPassword, role: "ADMIN", statut: "ACTIF" },
    });
    // Compte inactif pour tester le refus
    await prisma.compte.create({
      data: { email: "inactif@cabinet.com", motDePasse: hashedPassword, role: "MEDECIN", statut: "INACTIF" },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ── AUTH ────────────────────────────────────────────────────────────────────

  describe("Auth — cas nominaux", () => {
    it("login succès — retourne accessToken + refreshToken (200)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@cabinet.com", password: "Password123!" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it("refresh token valide — retourne un nouveau accessToken (200)", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
    });

    it("logout — déconnexion réussie (200)", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Déconnexion réussie");

      // Re-login pour la suite des tests
      const relogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@cabinet.com", password: "Password123!" });
      accessToken = relogin.body.accessToken;
    });
  });

  describe("Auth — cas limites et erreurs métier", () => {
    it("login — email manquant → 400", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "Password123!" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("login — mot de passe manquant → 400", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@cabinet.com" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("login — email invalide (format) → 400", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "pas-un-email", password: "Password123!" });

      expect(res.status).toBe(400);
    });

    it("login — mauvais mot de passe → 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@cabinet.com", password: "WrongPassword!" });

      expect(res.status).toBe(401);
    });

    it("login — compte inexistant → 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "inconnu@cabinet.com", password: "Password123!" });

      expect(res.status).toBe(401);
    });

    it("login — compte INACTIF → 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "inactif@cabinet.com", password: "Password123!" });

      expect(res.status).toBe(401);
    });

    it("refresh — token invalide → 4xx", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "token.invalide.bidon" });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("refresh — body vide → 400", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({});

      expect(res.status).toBe(400);
    });

    it("route protégée sans JWT → 401", async () => {
      const res = await request(app).get("/api/patients");
      expect(res.status).toBe(401);
    });
  });

  // ── PATIENTS ────────────────────────────────────────────────────────────────

  describe("Patients — cas nominaux", () => {
    const patientData = {
      numeroDossier: "PAT-TEST-001",
      nom: "Doe",
      prenom: "John",
      dateNaissance: "1990-01-01T00:00:00.000Z",
      sexe: "M",
      nni: "1234567890123",
      telephone: "0102030405",
      email: "john.doe@test.com",
    };

    it("création patient — 201 + données cohérentes en base", async () => {
      const res = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(patientData);

      expect(res.status).toBe(201);
      expect(res.body.nom).toBe(patientData.nom);
      expect(res.body.numeroDossier).toBe(patientData.numeroDossier);
      patientId = res.body.id;

      const dbPatient = await prisma.patient.findUnique({ where: { nni: patientData.nni } });
      expect(dbPatient).toBeDefined();
    });

    it("liste patients — contient le patient créé (200)", async () => {
      const res = await request(app)
        .get("/api/patients")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((p: { nni: string }) => p.nni === patientData.nni)).toBe(true);
    });

    it("get patient par ID — retourne le patient (200)", async () => {
      const res = await request(app)
        .get(`/api/patients/${patientId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(patientId);
    });

    it("mise à jour patient — 200 avec champ modifié", async () => {
      const res = await request(app)
        .patch(`/api/patients/${patientId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ telephone: "0600000001" });

      expect(res.status).toBe(200);
      expect(res.body.telephone).toBe("0600000001");
    });
  });

  describe("Patients — cas limites et erreurs métier", () => {
    it("création patient — champs requis manquants → 400", async () => {
      const res = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ nom: "Seulement le nom" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("création patient — sexe invalide → 400", async () => {
      const res = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          numeroDossier: "PAT-X-001",
          nom: "Test",
          prenom: "Sexe",
          dateNaissance: "1990-01-01",
          sexe: "X",
          nni: "9999999999999",
        });

      expect(res.status).toBe(400);
    });

    it("création patient — NNI dupliqué → 409", async () => {
      const res = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          numeroDossier: "PAT-TEST-002",
          nom: "Autre",
          prenom: "Patient",
          dateNaissance: "1985-03-15T00:00:00.000Z",
          sexe: "F",
          nni: "1234567890123", // même NNI que le premier
        });

      expect(res.status).toBe(409);
    });

    it("get patient — ID inexistant → 404", async () => {
      const res = await request(app)
        .get("/api/patients/id-inexistant-12345")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("suppression patient (soft delete) — 200 puis disparu de la liste", async () => {
      const res = await request(app)
        .delete(`/api/patients/${patientId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const liste = await request(app)
        .get("/api/patients")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(liste.body.some((p: { id: string }) => p.id === patientId)).toBe(false);
    });
  });
});
