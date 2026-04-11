import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import * as rapportsService from "./rapportsStatistiques.service";

const dashboardQuerySchema = z.object({
  rangeDays: z.coerce.number().int().positive().max(365).optional(),
  expiringSoonDays: z.coerce.number().int().positive().max(365).optional(),
});

export async function getDashboardStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = dashboardQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Paramètres de tableau de bord invalides" });
      return;
    }

    const result = await rapportsService.getDashboardStats({
      rangeDays: parsed.data.rangeDays,
      expiringSoonDays: parsed.data.expiringSoonDays,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}
