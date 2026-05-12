import { prisma } from "../../prisma/client";

export const consultationService = {
  async createConsultation(data: {
    rdvId: string;
    patientId: string;
    medecinId: string;
    motif: string;
    symptomes?: string;
    diagnostic?: string;
    traitement?: string;
    tensionArterielle?: string;
    poids?: number;
    temperature?: number;
    notes?: string;
  }) {
    const rdv = await prisma.rendezVous.findUnique({ where: { id: data.rdvId } });
    if (!rdv) throw new Error("Rendez-vous non trouvé");

    return prisma.$transaction(async (tx) => {
      const consultation = await tx.consultation.create({ data });
      await tx.rendezVous.update({
        where: { id: data.rdvId },
        data: { statut: "TERMINE" },
      });
      return consultation;
    });
  },

  async getConsultationById(id: string) {
    return prisma.consultation.findUnique({
      where: { id },
      include: { patient: true, medecin: true, prescriptions: { include: { items: true } } },
    });
  },
};
