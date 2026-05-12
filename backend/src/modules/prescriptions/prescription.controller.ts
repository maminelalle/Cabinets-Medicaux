import type { Request, Response } from "express";

import { prescriptionService } from "./prescription.service";

export const prescriptionController = {
  async create(req: Request, res: Response) {
    try {
      const prescription = await prescriptionService.createPrescription(req.body);
      res.status(201).json(prescription);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Erreur inconnue" });
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const id = req.params["id"] as string;
      const prescription = await prescriptionService.getPrescriptionById(id);
      if (!prescription) return res.status(404).json({ error: "Prescription non trouvée" });
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },

  async getByConsultation(req: Request, res: Response) {
    try {
      const consultationId = req.params["consultationId"] as string;
      const prescriptions = await prescriptionService.getPrescriptionsByConsultation(consultationId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Erreur serveur" });
    }
  },
};
