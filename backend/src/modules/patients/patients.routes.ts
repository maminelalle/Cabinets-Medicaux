import { Router } from "express";

import { validate } from "../../middlewares/validate";
import { verifyJWT } from "../../middlewares/verifyJWT";

import { patientsController } from "./patients.controller";
import { createPatientSchema } from "./patients.schema";

const router = Router();

router.use(verifyJWT);

router.post("/", validate(createPatientSchema), patientsController.create);
router.get("/", patientsController.getAll);
router.get("/:id", patientsController.getOne);
router.patch("/:id", patientsController.update);
router.delete("/:id", patientsController.softDelete);

export default router;
