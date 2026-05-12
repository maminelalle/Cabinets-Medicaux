import { z } from "zod";

export const createRendezVousSchema = z.object({
  patientId: z.string().min(1, "patientId requis"),
  medecinId: z.string().min(1, "medecinId requis"),
  dateHeure: z.string().min(1, "dateHeure requise"),
  duree: z.number().int().positive("Durée doit être positive").optional(),
  motif: z.string().optional(),
  notes: z.string().optional(),
});

export const updateStatutSchema = z.object({
  statut: z.enum(["PLANIFIE", "CONFIRME", "EN_COURS", "TERMINE", "ANNULE", "ABSENT"]),
});
