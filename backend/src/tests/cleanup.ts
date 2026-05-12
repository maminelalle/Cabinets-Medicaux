import { prisma } from "../prisma/client";

export async function cleanupDatabase() {
  await prisma.mouvementStock.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.rendezVous.deleteMany();
  await prisma.medecin.deleteMany();
  await prisma.personnel.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.medicament.deleteMany();
  await prisma.compte.deleteMany();
}
