import { Router } from "express";

import { validate } from "../../middlewares/validate";
import { verifyJWT } from "../../middlewares/verifyJWT";

import { prescriptionController } from "./prescription.controller";
import { createPrescriptionSchema } from "./prescription.schema";

const router = Router();

router.use(verifyJWT);

router.post("/", validate(createPrescriptionSchema), prescriptionController.create);
router.get("/consultation/:consultationId", prescriptionController.getByConsultation);
router.get("/:id", prescriptionController.getOne);

export default router;
