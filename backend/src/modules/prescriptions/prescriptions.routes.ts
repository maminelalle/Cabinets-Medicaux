import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";
import { verifyRole } from "../../middlewares/verifyRole";

import {
  createPrescriptionHandler,
  deletePrescriptionHandler,
  getPrescriptionByIdHandler,
  listPrescriptionsHandler,
  updatePrescriptionHandler,
} from "./prescriptions.controller";

const router = Router();

router.use(verifyJWT);

router.get("/", listPrescriptionsHandler);
router.get("/:id", getPrescriptionByIdHandler);

router.post("/", verifyRole("ADMIN", "MEDECIN"), createPrescriptionHandler);
router.patch("/:id", verifyRole("ADMIN", "MEDECIN"), updatePrescriptionHandler);
router.delete("/:id", verifyRole("ADMIN"), deletePrescriptionHandler);

export default router;
