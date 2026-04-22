import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";

import { stockController } from "./stock.controller";


const router = Router();

router.use(verifyJWT);

router.post("/medicaments", stockController.createMedicament);
router.get("/medicaments/:id", stockController.getMedicament);

export default router;
