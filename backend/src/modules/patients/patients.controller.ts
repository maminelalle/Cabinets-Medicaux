import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import * as patientsService from "./patients.service";

const listPatientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().trim().min(1).optional(),
});

const createPatientSchema = z.object({
  nom: z.string().trim().min(1),
  prenom: z.string().trim().min(1),
  dateNaissance: z.string().date(),
  sexe: z.string().trim().min(1),
  nni: z.string().trim().min(1),
  telephone: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  adresse: z.string().trim().optional(),
  groupeSanguin: z.string().trim().optional(),
  antecedents: z.string().trim().optional(),
  allergies: z.string().trim().optional(),
});

const updatePatientSchema = createPatientSchema.partial();

function normalizeOptionalStrings<T extends Record<string, unknown>>(payload: T): T {
  const normalized = { ...payload } as T;

  for (const key of Object.keys(normalized) as Array<keyof T>) {
    const value = normalized[key];
    if (typeof value === "string" && value.length === 0) {
      normalized[key] = undefined as T[keyof T];
    }
  }

  return normalized;
}

export async function listPatientsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listPatientsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Paramètres de recherche invalides" });
      return;
    }

    const result = await patientsService.listPatients({
      page: parsed.data.page,
      limit: parsed.data.limit,
      query: parsed.data.q,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPatientByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const patient = await patientsService.getPatientById(patientId);
    if (!patient) {
      res.status(404).json({ message: "Patient introuvable" });
      return;
    }

    res.json(patient);
  } catch (err) {
    next(err);
  }
}

export async function createPatientHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createPatientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const created = await patientsService.createPatient(payload);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updatePatientHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updatePatientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const patientId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await patientsService.updatePatient(patientId, payload);

    if (!updated) {
      res.status(404).json({ message: "Patient introuvable" });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deletePatientHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await patientsService.softDeletePatient(patientId);
    if (!deleted) {
      res.status(404).json({ message: "Patient introuvable" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
