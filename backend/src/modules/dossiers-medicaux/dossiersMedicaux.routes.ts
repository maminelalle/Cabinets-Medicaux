import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";
import { verifyRole } from "../../middlewares/verifyRole";

import {
  createDossierMedicalHandler,
  deleteDossierMedicalHandler,
  getDossierMedicalByIdHandler,
  listDossiersMedicauxHandler,
  updateDossierMedicalHandler,
} from "./dossiersMedicaux.controller";

const router = Router();

router.use(verifyJWT);

router.get("/", listDossiersMedicauxHandler);
router.get("/:id", getDossierMedicalByIdHandler);

router.post("/", verifyRole("ADMIN", "MEDECIN", "SECRETAIRE"), createDossierMedicalHandler);
router.patch("/:id", verifyRole("ADMIN", "MEDECIN", "SECRETAIRE"), updateDossierMedicalHandler);
router.delete("/:id", verifyRole("ADMIN"), deleteDossierMedicalHandler);

export default router;
