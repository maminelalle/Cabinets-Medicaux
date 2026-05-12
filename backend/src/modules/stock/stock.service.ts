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

  async getAllMedicaments() {
    return prisma.medicament.findMany({ orderBy: { nom: "asc" } });
  },

  async getMedicamentById(id: string) {
    return prisma.medicament.findUnique({ where: { id } });
  },

  async updateStock(medicamentId: string, quantite: number, type: "ENTREE" | "SORTIE", motif?: string) {
    return prisma.$transaction(async (tx) => {
      const medicament = await tx.medicament.findUnique({ where: { id: medicamentId } });
      if (!medicament) throw new Error("Médicament non trouvé");

      const delta = type === "ENTREE" ? quantite : -quantite;
      const nouveauStock = medicament.stockActuel + delta;
      if (nouveauStock < 0) throw new Error("Stock insuffisant");

      await tx.medicament.update({
        where: { id: medicamentId },
        data: { stockActuel: nouveauStock },
      });

      await tx.mouvementStock.create({
        data: { medicamentId, type, quantite, motif },
      });

      return { ...medicament, stockActuel: nouveauStock };
    });
  },
};
