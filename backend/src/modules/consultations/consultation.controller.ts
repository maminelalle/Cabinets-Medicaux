import type { Request, Response } from "express";

import { consultationService } from "./consultation.service";

export const consultationController = {
  async create(req: Request, res: Response) {
    try {
      const consultation = await consultationService.createConsultation(req.body);
      res.status(201).json(consultation);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      const status = msg === "Rendez-vous non trouvé" ? 404 : 400;
      res.status(status).json({ error: msg });
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const id = req.params["id"] as string;
      const consultation = await consultationService.getConsultationById(id);
      if (!consultation) return res.status(404).json({ error: "Consultation non trouvée" });
      res.json(consultation);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },
};
