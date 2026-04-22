import type { Request, Response } from "express";

import { patientsService } from "./patients.service";

export const patientsController = {
  async create(req: Request, res: Response) {
    try {
      const patient = await patientsService.createPatient(req.body);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Erreur inconnue" });
    }
  },

  async getAll(_req: Request, res: Response) {
    try {
      const patients = await patientsService.getAllPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },
};
