import type { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import * as medecinsService from "./medecins.service";

const listMedecinsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().trim().min(1).optional(),
  specialite: z.string().trim().min(1).optional(),
  statut: z.enum(["ACTIF", "INACTIF"]).optional(),
});

const createMedecinSchema = z.object({
  compteId: z.string().trim().min(1),
  nom: z.string().trim().min(1),
  prenom: z.string().trim().min(1),
  specialite: z.string().trim().min(1),
  telephone: z.string().trim().optional(),
  numeroOrdre: z.string().trim().optional(),
  formation: z.string().trim().optional(),
  experience: z.string().trim().optional(),
  disponibilites: z.record(z.string(), z.array(z.string())).optional(),
  statut: z.boolean().optional(),
});

const updateMedecinSchema = createMedecinSchema.omit({ compteId: true }).partial();

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

function mapDisponibilites(input: z.infer<typeof createMedecinSchema>["disponibilites"]) {
  return input as Prisma.InputJsonValue | undefined;
}

export async function listMedecinsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listMedecinsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Paramètres de recherche invalides" });
      return;
    }

    const result = await medecinsService.listMedecins({
      page: parsed.data.page,
      limit: parsed.data.limit,
      query: parsed.data.q,
      specialite: parsed.data.specialite,
      statut: parsed.data.statut,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMedecinByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const medecin = await medecinsService.getMedecinById(getParamId(req));
    if (!medecin) {
      res.status(404).json({ message: "Medecin introuvable" });
      return;
    }

    res.json(medecin);
  } catch (err) {
    next(err);
  }
}

export async function createMedecinHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createMedecinSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);

    const created = await medecinsService.createMedecin({
      ...payload,
      disponibilites: mapDisponibilites(payload.disponibilites),
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updateMedecinHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateMedecinSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);

    const updated = await medecinsService.updateMedecin(getParamId(req), {
      ...payload,
      disponibilites: mapDisponibilites(payload.disponibilites),
    });

    if (!updated) {
      res.status(404).json({ message: "Medecin introuvable" });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deactivateMedecinHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const deactivated = await medecinsService.deactivateMedecin(getParamId(req));
    if (!deactivated) {
      res.status(404).json({ message: "Medecin introuvable" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
