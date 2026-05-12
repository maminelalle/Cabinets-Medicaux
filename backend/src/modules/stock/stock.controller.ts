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

  async getAllMedicaments(_req: Request, res: Response) {
    try {
      const medicaments = await stockService.getAllMedicaments();
      res.json(medicaments);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },

  async getMedicament(req: Request, res: Response) {
    try {
      const id = req.params["id"] as string;
      const medicament = await stockService.getMedicamentById(id);
      if (!medicament) return res.status(404).json({ error: "Médicament non trouvé" });
      res.json(medicament);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },

  async updateStock(req: Request, res: Response) {
    try {
      const id = req.params["id"] as string;
      const { quantite, type, motif } = req.body as { quantite: number; type: "ENTREE" | "SORTIE"; motif?: string };
      const result = await stockService.updateStock(id, quantite, type, motif);
      res.json(result);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      const status = msg === "Médicament non trouvé" ? 404 : 400;
      res.status(status).json({ error: msg });
    }
  },
};
