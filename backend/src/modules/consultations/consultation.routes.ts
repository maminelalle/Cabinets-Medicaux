import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";

import { consultationController } from "./consultation.controller";


const router = Router();

router.use(verifyJWT);

router.post("/", consultationController.create);

export default router;
