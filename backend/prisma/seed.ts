import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Compte admin
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.compte.upsert({
    where: { email: "admin@cabinet.com" },
    update: {},
    create: {
      email: "admin@cabinet.com",
      motDePasse: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Compte médecin
  const medecinPassword = await bcrypt.hash("Medecin123!", 12);
  const compteMedecin = await prisma.compte.upsert({
    where: { email: "dr.dupont@cabinet.com" },
    update: {},
    create: {
      email: "dr.dupont@cabinet.com",
      motDePasse: medecinPassword,
      role: Role.MEDECIN,
      medecin: {
        create: {
          nom: "Dupont",
          prenom: "Jean",
          specialite: "Médecine générale",
          telephone: "+222 20 00 00 01",
          disponibilites: {
            lundi: ["09:00-12:00", "14:00-17:00"],
            mardi: ["09:00-12:00", "14:00-17:00"],
            mercredi: ["09:00-12:00"],
            jeudi: ["09:00-12:00", "14:00-17:00"],
            vendredi: ["09:00-12:00"],
          },
        },
      },
    },
  });

  // Patient test
  await prisma.patient.upsert({
    where: { nni: "1234567890123" },
    update: {},
    create: {
      numeroDossier: "PAT-2026-00001",
      nom: "Ben Ahmed",
      prenom: "Mohamed",
      dateNaissance: new Date("1985-03-15"),
      sexe: "M",
      nni: "1234567890123",
      telephone: "+222 20 00 00 02",
    },
  });

  console.warn("Seed terminé :", { admin: admin.email, medecin: compteMedecin.email });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
