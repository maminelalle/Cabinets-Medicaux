import { Router } from "express";

import { validate } from "../../middlewares/validate";
import { verifyJWT } from "../../middlewares/verifyJWT";

import { stockController } from "./stock.controller";
import { createMedicamentSchema, updateStockSchema } from "./stock.schema";

const router = Router();

router.use(verifyJWT);

router.post("/medicaments", validate(createMedicamentSchema), stockController.createMedicament);
router.get("/medicaments", stockController.getAllMedicaments);
router.get("/medicaments/:id", stockController.getMedicament);
router.patch("/medicaments/:id/stock", validate(updateStockSchema), stockController.updateStock);

export default router;
