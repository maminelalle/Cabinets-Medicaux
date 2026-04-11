import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import * as medicamentsService from "./medicaments.service";

const listMedicamentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().trim().min(1).optional(),
  lowStockOnly: z.coerce.boolean().optional(),
  expiredOnly: z.coerce.boolean().optional(),
  expiringSoonDays: z.coerce.number().int().positive().max(365).optional(),
});

const createMedicamentSchema = z.object({
  nom: z.string().trim().min(1),
  forme: z.string().trim().optional(),
  dosage: z.string().trim().optional(),
  stockActuel: z.coerce.number().int().min(0).optional(),
  seuilAlerte: z.coerce.number().int().min(0).optional(),
  dateExpiration: z.string().date().optional(),
});

const updateMedicamentSchema = createMedicamentSchema.partial();

const recordMovementSchema = z.object({
  type: z.enum(["ENTREE", "SORTIE"]),
  quantite: z.coerce.number().int().positive(),
  motif: z.string().trim().optional(),
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

export async function listMedicamentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listMedicamentsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Paramètres de recherche invalides" });
      return;
    }

    const result = await medicamentsService.listMedicaments({
      page: parsed.data.page,
      limit: parsed.data.limit,
      query: parsed.data.q,
      lowStockOnly: parsed.data.lowStockOnly,
      expiredOnly: parsed.data.expiredOnly,
      expiringSoonDays: parsed.data.expiringSoonDays,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMedicamentByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const medicament = await medicamentsService.getMedicamentById(getParamId(req));
    if (!medicament) {
      res.status(404).json({ message: "Médicament introuvable" });
      return;
    }

    res.json(medicament);
  } catch (err) {
    next(err);
  }
}

export async function createMedicamentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createMedicamentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const created = await medicamentsService.createMedicament(payload);

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updateMedicamentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateMedicamentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const updated = await medicamentsService.updateMedicament(getParamId(req), payload);

    if (!updated) {
      res.status(404).json({ message: "Médicament introuvable" });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteMedicamentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await medicamentsService.deleteMedicament(getParamId(req));
    if (!deleted) {
      res.status(404).json({ message: "Médicament introuvable" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listLowStockMedicamentsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = await medicamentsService.listLowStockMedicaments();
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function listExpiringMedicamentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const days = req.query.days ? z.coerce.number().int().positive().max(365).parse(req.query.days) : 30;
    const items = await medicamentsService.listExpiringMedicaments(days);
    res.json({ items, days });
  } catch (err) {
    next(err);
  }
}

export async function recordStockMovementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = recordMovementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const movement = await medicamentsService.recordStockMovement({
      medicamentId: getParamId(req),
      ...parsed.data,
    });

    res.status(201).json(movement);
  } catch (err) {
    next(err);
  }
}
