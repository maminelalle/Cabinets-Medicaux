import { z } from "zod";

export const createConsultationSchema = z.object({
  rdvId: z.string().min(1, "rdvId requis"),
  patientId: z.string().min(1, "patientId requis"),
  medecinId: z.string().min(1, "medecinId requis"),
  motif: z.string().min(1, "Motif requis"),
  symptomes: z.string().optional(),
  diagnostic: z.string().optional(),
  traitement: z.string().optional(),
  tensionArterielle: z.string().optional(),
  poids: z.number().optional(),
  temperature: z.number().optional(),
  notes: z.string().optional(),
});
