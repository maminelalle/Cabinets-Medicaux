import type { Request, Response } from "express";

import { rendezvousService } from "./rendezvous.service";

export const rendezvousController = {
  async create(req: Request, res: Response) {
    try {
      const rdv = await rendezvousService.createRendezVous(req.body);
      res.status(201).json(rdv);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      const status = msg === "Conflit d'horaire" ? 409 : 400;
      res.status(status).json({ error: msg });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const patientId = req.query["patientId"] as string | undefined;
      const medecinId = req.query["medecinId"] as string | undefined;
      const rdvs = await rendezvousService.getAllRendezVous({ patientId, medecinId });
      res.json(rdvs);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const id = req.params["id"] as string;
      const rdv = await rendezvousService.getRendezVousById(id);
      if (!rdv) return res.status(404).json({ error: "Rendez-vous non trouvé" });
      res.json(rdv);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },

  async updateStatut(req: Request, res: Response) {
    try {
      const id = req.params["id"] as string;
      const rdv = await rendezvousService.updateStatut(id, req.body.statut);
      res.json(rdv);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      const status = msg === "Rendez-vous non trouvé" ? 404 : 400;
      res.status(status).json({ error: msg });
    }
  },
};
