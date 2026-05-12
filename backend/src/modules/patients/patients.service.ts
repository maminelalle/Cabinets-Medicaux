import { prisma } from "../../prisma/client";

export interface PatientData {
  numeroDossier: string;
  nom: string;
  prenom: string;
  dateNaissance: string | Date;
  sexe: string;
  nni: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  groupeSanguin?: string;
  antecedents?: string;
  allergies?: string;
}

export const patientsService = {
  async createPatient(data: PatientData) {
    return prisma.patient.create({ data });
  },

  async getAllPatients() {
    return prisma.patient.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },

  async getPatientById(id: string) {
    return prisma.patient.findFirst({ where: { id, deletedAt: null } });
  },

  async updatePatient(id: string, data: Partial<PatientData>) {
    return prisma.patient.update({ where: { id }, data });
  },

  async softDeletePatient(id: string) {
    return prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
