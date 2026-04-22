import type { Request, Response } from "express";

import { prescriptionService } from "./prescription.service";

export const prescriptionController = {
  async create(req: Request, res: Response) {
    try {
      const prescription = await prescriptionService.createPrescription(req.body);
      res.status(201).json(prescription);
    } catch (error) {
      const isStockError = error instanceof Error && error.message.includes("Stock insuffisant");
      res.status(isStockError ? 400 : 400).json({ error: error instanceof Error ? error.message : "Erreur inconnue" });
    }
  },
};
