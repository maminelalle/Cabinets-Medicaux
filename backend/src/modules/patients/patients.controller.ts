import type { Request, Response } from "express";

import { patientsService } from "./patients.service";

export const patientsController = {
  async create(req: Request, res: Response) {
    try {
      const patient = await patientsService.createPatient(req.body);
      res.status(201).json(patient);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      const isDuplicate = msg.includes("Unique constraint");
      res.status(isDuplicate ? 409 : 400).json({ error: isDuplicate ? "Dossier ou NNI déjà existant" : msg });
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

  async getOne(req: Request, res: Response) {
    try {
      const id = req.params["id"] as string;
      const patient = await patientsService.getPatientById(id);
      if (!patient) return res.status(404).json({ error: "Patient non trouvé" });
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = req.params["id"] as string;
      const patient = await patientsService.getPatientById(id);
      if (!patient) return res.status(404).json({ error: "Patient non trouvé" });
      const updated = await patientsService.updatePatient(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Erreur inconnue" });
    }
  },

  async softDelete(req: Request, res: Response) {
    try {
      const id = req.params["id"] as string;
      const patient = await patientsService.getPatientById(id);
      if (!patient) return res.status(404).json({ error: "Patient non trouvé" });
      await patientsService.softDeletePatient(id);
      res.json({ message: "Patient archivé" });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },
};
