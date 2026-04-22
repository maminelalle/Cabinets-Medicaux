import type { Request, Response } from "express";

import { rendezvousService } from "./rendezvous.service";

export const rendezvousController = {
  async create(req: Request, res: Response) {
    try {
      const rdv = await rendezvousService.createRendezVous(req.body);
      res.status(201).json(rdv);
    } catch (error) {
      const status = error instanceof Error && error.message === "Conflit d'horaire" ? 409 : 400;
      res.status(status).json({ error: error instanceof Error ? error.message : "Erreur inconnue" });
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const rdv = await rendezvousService.getRendezVousById(req.params.id as string);

      if (!rdv) return res.status(404).json({ error: "Rendez-vous non trouvé" });
      res.json(rdv);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },
};
