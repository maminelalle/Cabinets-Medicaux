import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import bcrypt from "bcrypt";
import request from "supertest";

import app from "../app";
import { prisma } from "../prisma/client";

import { cleanupDatabase } from "./cleanup";

describe("TÂCHE 2 — Tests intégration rendezvous + consultations", () => {
  let accessToken: string;
  let patientId: string;
  let medecinId: string;
  let rendezvousId: string;

  beforeAll(async () => {
    // Nettoyage
    await cleanupDatabase();

    // Création admin
    const hashedPassword = await bcrypt.hash("Password123!", 12);
    await prisma.compte.create({
      data: {
        email: "admin@cabinet.com",
        motDePasse: hashedPassword,
        role: "ADMIN",
        statut: "ACTIF",
      },
    });

    // Login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@cabinet.com", password: "Password123!" });
    accessToken = loginRes.body.accessToken;

    // Création médecin
    const medecinCompte = await prisma.compte.create({
      data: {
        email: "medecin@test.com",
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
    medecinId = medecin.id;

    // Création patient
    const patient = await prisma.patient.create({
      data: {
        numeroDossier: "PAT-T2-001",
        nom: "Doe",
        prenom: "Jane",
        dateNaissance: new Date("1995-05-05"),
        sexe: "F",
        nni: "1234567890999",
      },
    });
    patientId = patient.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Rendez-vous", () => {
    const rdvDate = new Date();
    rdvDate.setHours(rdvDate.getHours() + 24); // Demain
    rdvDate.setMinutes(0, 0, 0);

    it("creation rendezvous — créer un rendez-vous valide (201)", async () => {
      const res = await request(app)
        .post("/api/rendezvous")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          patientId,
          medecinId,
          dateHeure: rdvDate.toISOString(),
          motif: "Consultation de routine",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      rendezvousId = res.body.id;
    });

    it("rejet conflit horaire — vérifier que le conflit est rejeté (409)", async () => {
      const res = await request(app)
        .post("/api/rendezvous")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          patientId,
          medecinId,
          dateHeure: rdvDate.toISOString(),
          motif: "Autre motif",
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Conflit d'horaire");
    });
  });

  describe("Consultations", () => {
    it("creation consultation depuis rendezvous — vérifier 201", async () => {
      const res = await request(app)
        .post("/api/consultations")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          rdvId: rendezvousId,
          patientId,
          medecinId,
          motif: "Consultation de routine",
          diagnostic: "Tout va bien",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });

    it("statut rendezvous apres consultation — vérifier statut 'TERMINE'", async () => {
      const res = await request(app)
        .get(`/api/rendezvous/${rendezvousId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.statut).toBe("TERMINE");
    });
  });
});
