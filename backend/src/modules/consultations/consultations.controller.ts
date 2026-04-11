import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import * as consultationsService from "./consultations.service";

const listConsultationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  patientId: z.string().trim().min(1).optional(),
  medecinId: z.string().trim().min(1).optional(),
  rdvId: z.string().trim().min(1).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

const createConsultationSchema = z.object({
  rdvId: z.string().trim().min(1),
  patientId: z.string().trim().min(1),
  medecinId: z.string().trim().min(1),
  motif: z.string().trim().min(1),
  symptomes: z.string().trim().optional(),
  diagnostic: z.string().trim().optional(),
  traitement: z.string().trim().optional(),
  tensionArterielle: z.string().trim().optional(),
  poids: z.coerce.number().positive().max(500).optional(),
  temperature: z.coerce.number().positive().max(50).optional(),
  notes: z.string().trim().optional(),
});

const updateConsultationSchema = createConsultationSchema
  .omit({ rdvId: true, patientId: true, medecinId: true })
  .partial();

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

export async function listConsultationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listConsultationsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Paramètres de recherche invalides" });
      return;
    }

    const result = await consultationsService.listConsultations({
      page: parsed.data.page,
      limit: parsed.data.limit,
      patientId: parsed.data.patientId,
      medecinId: parsed.data.medecinId,
      rdvId: parsed.data.rdvId,
      from: parsed.data.from,
      to: parsed.data.to,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getConsultationByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const consultation = await consultationsService.getConsultationById(getParamId(req));
    if (!consultation) {
      res.status(404).json({ message: "Consultation introuvable" });
      return;
    }

    res.json(consultation);
  } catch (err) {
    next(err);
  }
}

export async function createConsultationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createConsultationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const created = await consultationsService.createConsultation(payload);

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updateConsultationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateConsultationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const updated = await consultationsService.updateConsultation(getParamId(req), payload);

    if (!updated) {
      res.status(404).json({ message: "Consultation introuvable" });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteConsultationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await consultationsService.deleteConsultation(getParamId(req));
    if (!deleted) {
      res.status(404).json({ message: "Consultation introuvable" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
