import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import bcrypt from "bcrypt";
import request from "supertest";

import app from "../app";
import { prisma } from "../prisma/client";

import { cleanupDatabase } from "./cleanup";

describe("TÂCHE 1 — Tests intégration auth + patients", () => {
  let accessToken: string;

  beforeAll(async () => {
    // Nettoyage de la base
    await cleanupDatabase();

    // Création d'un compte admin pour les tests
    const hashedPassword = await bcrypt.hash("Password123!", 12);
    await prisma.compte.create({
      data: {
        email: "test@cabinet.com",
        motDePasse: hashedPassword,
        role: "ADMIN",
        statut: "ACTIF",
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Auth", () => {
    it("login succes — vérifier que le response contient un token (200)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@cabinet.com",
          password: "Password123!",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      accessToken = res.body.accessToken;
    });

    it("login echec — vérifier erreur 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@cabinet.com",
          password: "WrongPassword!",
        });

      expect(res.status).toBe(401);
    });
  });

  describe("Patients", () => {
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

    it("creation patient — vérifier qu'il est bien en base (201 + données cohérentes)", async () => {
      const res = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(patientData);

      expect(res.status).toBe(201);
      expect(res.body.nom).toBe(patientData.nom);
      expect(res.body.numeroDossier).toBe(patientData.numeroDossier);

      const dbPatient = await prisma.patient.findUnique({
        where: { nni: patientData.nni },
      });
      expect(dbPatient).toBeDefined();
    });

    it("liste patients — vérifier qu'elle contient le patient créé", async () => {
      const res = await request(app)
        .get("/api/patients")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.some((p: { nni: string }) => p.nni === patientData.nni)).toBe(true);
    });
  });
});
