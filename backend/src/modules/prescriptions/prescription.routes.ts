import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";

import { prescriptionController } from "./prescription.controller";


const router = Router();

router.use(verifyJWT);

router.post("/", prescriptionController.create);

export default router;
