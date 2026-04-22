import type { Request, Response } from "express";

import { consultationService } from "./consultation.service";

export const consultationController = {
  async create(req: Request, res: Response) {
    try {
      const consultation = await consultationService.createConsultation(req.body);
      res.status(201).json(consultation);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Erreur inconnue" });
    }
  },
};
