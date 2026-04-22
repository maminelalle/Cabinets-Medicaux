import { prisma } from "../../prisma/client";


export const prescriptionService = {
  async createPrescription(data: {
    consultationId: string;
    notes?: string;
    items: Array<{
      medicamentId: string;
      posologie: string;
      duree: string;
      quantite: number;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Vérifier le stock pour tous les items
      for (const item of data.items) {
        const medicament = await tx.medicament.findUnique({ where: { id: item.medicamentId } });
        if (!medicament || medicament.stockActuel < item.quantite) {
          throw new Error(`Stock insuffisant pour ${medicament?.nom || "le médicament"}`);
        }
      }

      // 2. Créer la prescription
      const prescription = await tx.prescription.create({
        data: {
          consultationId: data.consultationId,
          notes: data.notes,
          items: {
            create: data.items,
          },
        },
        include: { items: true },
      });

      // 3. Décrémenter le stock
      for (const item of data.items) {
        await tx.medicament.update({
          where: { id: item.medicamentId },
          data: { stockActuel: { decrement: item.quantite } },
        });

        await tx.mouvementStock.create({
          data: {
            medicamentId: item.medicamentId,
            type: "SORTIE",
            quantite: item.quantite,
            motif: `Prescription ${prescription.id}`,
          },
        });
      }

      return prescription;
    });
  },
};
