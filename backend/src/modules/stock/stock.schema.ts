import { z } from "zod";

export const createMedicamentSchema = z.object({
  nom: z.string().min(1, "Nom du médicament requis"),
  forme: z.string().optional(),
  dosage: z.string().optional(),
  stockActuel: z.number().int().nonnegative("Stock doit être >= 0").optional(),
  seuilAlerte: z.number().int().nonnegative("Seuil doit être >= 0").optional(),
  dateExpiration: z.string().optional(),
});

export const updateStockSchema = z.object({
  quantite: z.number().int().positive("Quantité doit être un entier positif"),
  type: z.enum(["ENTREE", "SORTIE"]),
  motif: z.string().optional(),
});
