import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import * as cabinetSettingsService from "./cabinetSettings.service";

const horairesSchema = z.record(z.string(), z.array(z.string()));

const updateCabinetSettingsSchema = z.object({
  nomCabinet: z.string().trim().min(1).optional(),
  adresse: z.string().trim().optional(),
  telephone: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  horaires: horairesSchema.optional(),
  fuseauHoraire: z.string().trim().min(1).optional(),
  langue: z.string().trim().min(2).max(5).optional(),
  devise: z.string().trim().min(3).max(3).optional(),
});

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

export async function getCabinetSettingsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await cabinetSettingsService.getCabinetSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

export async function updateCabinetSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateCabinetSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const payload = normalizeOptionalStrings(parsed.data);
    const updated = await cabinetSettingsService.updateCabinetSettings(payload);

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
