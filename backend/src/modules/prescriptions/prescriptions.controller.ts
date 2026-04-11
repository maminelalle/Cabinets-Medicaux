import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import * as prescriptionsService from "./prescriptions.service";

const listPrescriptionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  consultationId: z.string().trim().min(1).optional(),
  patientId: z.string().trim().min(1).optional(),
  medecinId: z.string().trim().min(1).optional(),
});

const createPrescriptionItemSchema = z.object({
  medicamentId: z.string().trim().min(1),
  posologie: z.string().trim().min(1),
  duree: z.string().trim().min(1),
  quantite: z.coerce.number().int().positive().max(1000),
});

const createPrescriptionSchema = z.object({
  consultationId: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  items: z.array(createPrescriptionItemSchema).min(1),
});

const updatePrescriptionSchema = z.object({
  notes: z.string().trim().optional(),
});

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

export async function listPrescriptionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listPrescriptionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Paramètres de recherche invalides" });
      return;
    }

    const result = await prescriptionsService.listPrescriptions({
      page: parsed.data.page,
      limit: parsed.data.limit,
      consultationId: parsed.data.consultationId,
      patientId: parsed.data.patientId,
      medecinId: parsed.data.medecinId,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPrescriptionByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const prescription = await prescriptionsService.getPrescriptionById(getParamId(req));
    if (!prescription) {
      res.status(404).json({ message: "Prescription introuvable" });
      return;
    }

    res.json(prescription);
  } catch (err) {
    next(err);
  }
}

export async function createPrescriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createPrescriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const created = await prescriptionsService.createPrescription(payload);

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updatePrescriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updatePrescriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const updated = await prescriptionsService.updatePrescription(getParamId(req), payload);

    if (!updated) {
      res.status(404).json({ message: "Prescription introuvable" });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deletePrescriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await prescriptionsService.deletePrescription(getParamId(req));
    if (!deleted) {
      res.status(404).json({ message: "Prescription introuvable" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
