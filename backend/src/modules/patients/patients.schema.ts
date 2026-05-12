import { z } from "zod";

export const createPatientSchema = z.object({
  numeroDossier: z.string().min(1, "Numéro de dossier requis"),
  nom: z.string().min(1, "Nom requis"),
  prenom: z.string().min(1, "Prénom requis"),
  dateNaissance: z.string().min(1, "Date de naissance requise"),
  sexe: z.enum(["M", "F"]),
  nni: z.string().min(1, "NNI requis"),
  telephone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  adresse: z.string().optional(),
  groupeSanguin: z.string().optional(),
  antecedents: z.string().optional(),
  allergies: z.string().optional(),
});
