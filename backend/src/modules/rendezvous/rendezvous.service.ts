import { prisma } from "../../prisma/client";

export const rendezvousService = {
  async createRendezVous(data: {
    patientId: string;
    medecinId: string;
    dateHeure: string | Date;
    duree?: number;
    motif?: string;
  }) {
    // Vérification de conflit (même médecin, même créneau)
    const date = new Date(data.dateHeure);
    const end = new Date(date.getTime() + (data.duree || 30) * 60000);

    const conflict = await prisma.rendezVous.findFirst({
      where: {
        medecinId: data.medecinId,
        statut: { not: "ANNULE" },
        OR: [
          {
            dateHeure: {
              gte: date,
              lt: end,
            },
          },
        ],
      },
    });

    if (conflict) {
      throw new Error("Conflit d'horaire");
    }

    return prisma.rendezVous.create({
      data: {
        ...data,
        dateHeure: date,
      },
    });
  },

  async getRendezVousById(id: string) {
    return prisma.rendezVous.findUnique({
      where: { id },
      include: { patient: true, medecin: true },
    });
  },

  async updateStatut(id: string, statut: "PLANIFIE" | "CONFIRME" | "EN_COURS" | "TERMINE" | "ANNULE" | "ABSENT") {

    return prisma.rendezVous.update({
      where: { id },
      data: { statut },
    });
  },
};
