import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";
import { verifyRole } from "../../middlewares/verifyRole";

import {
  createPatientHandler,
  deletePatientHandler,
  getPatientByIdHandler,
  listPatientsHandler,
  updatePatientHandler,
} from "./patients.controller";

const router = Router();

router.use(verifyJWT);

router.get("/", listPatientsHandler);
router.get("/:id", getPatientByIdHandler);

router.post("/", verifyRole("ADMIN", "SECRETAIRE"), createPatientHandler);
router.patch("/:id", verifyRole("ADMIN", "SECRETAIRE"), updatePatientHandler);
router.delete("/:id", verifyRole("ADMIN"), deletePatientHandler);

export default router;
