import type { Request, Response } from "express";

import { stockService } from "./stock.service";

export const stockController = {
  async createMedicament(req: Request, res: Response) {
    try {
      const medicament = await stockService.createMedicament(req.body);
      res.status(201).json(medicament);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Erreur inconnue" });
    }
  },

  async getMedicament(req: Request, res: Response) {
    try {
      const medicament = await stockService.getMedicamentById(req.params.id as string);
      if (!medicament) return res.status(404).json({ error: "Médicament non trouvé" });
      res.json(medicament);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },
};
