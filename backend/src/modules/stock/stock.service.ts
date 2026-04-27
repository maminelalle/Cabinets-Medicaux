import { prisma } from "../../prisma/client";

export const stockService = {
  async createMedicament(data: {
    nom: string;
    forme?: string;
    dosage?: string;
    stockActuel?: number;
    seuilAlerte?: number;
    dateExpiration?: string | Date;
  }) {
    return prisma.medicament.create({
      data: {
        ...data,
        dateExpiration: data.dateExpiration ? new Date(data.dateExpiration) : undefined,
      },
    });
  },

  async updateStock(medicamentId: string, quantiteChange: number, type: "ENTREE" | "SORTIE", motif?: string) {
    return prisma.$transaction(async (tx) => {
      const medicament = await tx.medicament.findUnique({ where: { id: medicamentId } });
      if (!medicament) throw new Error("Médicament non trouvé");

      const nouveauStock = medicament.stockActuel + quantiteChange;
      if (nouveauStock < 0) throw new Error("Stock insuffisant");

      await tx.medicament.update({
        where: { id: medicamentId },
        data: { stockActuel: nouveauStock },
      });

      await tx.mouvementStock.create({
        data: {
          medicamentId,
          type,
          quantite: Math.abs(quantiteChange),
          motif,
        },
      });

      return { ...medicament, stockActuel: nouveauStock };
    });
  },

  async getMedicamentById(id: string) {
    return prisma.medicament.findUnique({ where: { id } });
  },
};
