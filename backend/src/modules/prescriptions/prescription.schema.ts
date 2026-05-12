import { z } from "zod";

const prescriptionItemSchema = z.object({
  medicamentId: z.string().min(1, "medicamentId requis"),
  posologie: z.string().min(1, "Posologie requise"),
  duree: z.string().min(1, "Durée requise"),
  quantite: z.number().int().positive("Quantité doit être un entier positif"),
});

export const createPrescriptionSchema = z.object({
  consultationId: z.string().min(1, "consultationId requis"),
  notes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, "Au moins un médicament requis"),
});
