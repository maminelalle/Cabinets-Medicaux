import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";
import { verifyRole } from "../../middlewares/verifyRole";

import {
  createConsultationHandler,
  deleteConsultationHandler,
  getConsultationByIdHandler,
  listConsultationsHandler,
  updateConsultationHandler,
} from "./consultations.controller";

const router = Router();

router.use(verifyJWT);

router.get("/", listConsultationsHandler);
router.get("/:id", getConsultationByIdHandler);

router.post("/", verifyRole("ADMIN", "MEDECIN"), createConsultationHandler);
router.patch("/:id", verifyRole("ADMIN", "MEDECIN"), updateConsultationHandler);
router.delete("/:id", verifyRole("ADMIN"), deleteConsultationHandler);

export default router;
