import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";

import { patientsController } from "./patients.controller";


const router = Router();

// Routes protégées par JWT (à ajuster selon les besoins)
router.use(verifyJWT);

router.post("/", patientsController.create);
router.get("/", patientsController.getAll);

export default router;
