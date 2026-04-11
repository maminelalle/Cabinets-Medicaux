import type { StatutRDV } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import * as rendezVousService from "./rendezvous.service";

const statutValues = ["PLANIFIE", "CONFIRME", "EN_COURS", "TERMINE", "ANNULE", "ABSENT"] as const;

const listRendezVousQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  patientId: z.string().trim().min(1).optional(),
  medecinId: z.string().trim().min(1).optional(),
  statut: z.enum(statutValues).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

const createRendezVousSchema = z.object({
  patientId: z.string().trim().min(1),
  medecinId: z.string().trim().min(1),
  dateHeure: z.string().datetime(),
  duree: z.coerce.number().int().positive().max(480).optional(),
  motif: z.string().trim().optional(),
  statut: z.enum(statutValues).optional(),
  notes: z.string().trim().optional(),
});

const updateRendezVousSchema = createRendezVousSchema.partial();

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

function mapStatut(value: string | undefined) {
  return value as StatutRDV | undefined;
}

export async function listRendezVousHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listRendezVousQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Paramètres de recherche invalides" });
      return;
    }

    const result = await rendezVousService.listRendezVous({
      page: parsed.data.page,
      limit: parsed.data.limit,
      patientId: parsed.data.patientId,
      medecinId: parsed.data.medecinId,
      statut: mapStatut(parsed.data.statut),
      from: parsed.data.from,
      to: parsed.data.to,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getRendezVousByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rendezVous = await rendezVousService.getRendezVousById(getParamId(req));
    if (!rendezVous) {
      res.status(404).json({ message: "Rendez-vous introuvable" });
      return;
    }

    res.json(rendezVous);
  } catch (err) {
    next(err);
  }
}

export async function createRendezVousHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createRendezVousSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);

    const created = await rendezVousService.createRendezVous({
      ...payload,
      statut: mapStatut(payload.statut),
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updateRendezVousHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateRendezVousSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const updated = await rendezVousService.updateRendezVous(getParamId(req), {
      ...payload,
      statut: mapStatut(payload.statut),
    });

    if (!updated) {
      res.status(404).json({ message: "Rendez-vous introuvable" });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteRendezVousHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await rendezVousService.deleteRendezVous(getParamId(req));
    if (!deleted) {
      res.status(404).json({ message: "Rendez-vous introuvable" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
