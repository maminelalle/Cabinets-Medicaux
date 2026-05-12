import { Router } from "express";

import { validate } from "../../middlewares/validate";
import { verifyJWT } from "../../middlewares/verifyJWT";

import { consultationController } from "./consultation.controller";
import { createConsultationSchema } from "./consultation.schema";

const router = Router();

router.use(verifyJWT);

router.post("/", validate(createConsultationSchema), consultationController.create);
router.get("/:id", consultationController.getOne);

export default router;
