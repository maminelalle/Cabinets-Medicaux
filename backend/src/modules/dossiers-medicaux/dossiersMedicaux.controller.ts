import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import * as dossiersMedicauxService from "./dossiersMedicaux.service";

const listDossiersMedicauxQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  patientId: z.string().trim().min(1).optional(),
  type: z.string().trim().optional(),
  q: z.string().trim().min(1).optional(),
});

const createDossierMedicalSchema = z.object({
  patientId: z.string().trim().min(1),
  titre: z.string().trim().min(1),
  type: z.string().trim().min(1),
  fichierUrl: z.string().trim().url().optional(),
  notes: z.string().trim().optional(),
});

const updateDossierMedicalSchema = createDossierMedicalSchema.partial();

function getParamId(req: Request) {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

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

export async function listDossiersMedicauxHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listDossiersMedicauxQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Paramètres de recherche invalides" });
      return;
    }

    const result = await dossiersMedicauxService.listDossiersMedicaux({
      page: parsed.data.page,
      limit: parsed.data.limit,
      patientId: parsed.data.patientId,
      type: parsed.data.type,
      query: parsed.data.q,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDossierMedicalByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const dossier = await dossiersMedicauxService.getDossierMedicalById(getParamId(req));
    if (!dossier) {
      res.status(404).json({ message: "Dossier médical introuvable" });
      return;
    }

    res.json(dossier);
  } catch (err) {
    next(err);
  }
}

export async function createDossierMedicalHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createDossierMedicalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const created = await dossiersMedicauxService.createDossierMedical(payload);

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updateDossierMedicalHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateDossierMedicalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const updated = await dossiersMedicauxService.updateDossierMedical(getParamId(req), payload);

    if (!updated) {
      res.status(404).json({ message: "Dossier médical introuvable" });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteDossierMedicalHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await dossiersMedicauxService.deleteDossierMedical(getParamId(req));
    if (!deleted) {
      res.status(404).json({ message: "Dossier médical introuvable" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
