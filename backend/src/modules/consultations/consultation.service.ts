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
  }) {
    return prisma.$transaction(async (tx) => {
      const consultation = await tx.consultation.create({
        data,
      });

      // Mettre à jour le statut du rendez-vous
      await tx.rendezVous.update({
        where: { id: data.rdvId },
        data: { statut: "TERMINE" },
      });

      return consultation;
    });
  },
};
