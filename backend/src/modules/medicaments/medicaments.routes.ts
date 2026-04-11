import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";
import { verifyRole } from "../../middlewares/verifyRole";

import {
  createMedicamentHandler,
  deleteMedicamentHandler,
  getMedicamentByIdHandler,
  listExpiringMedicamentsHandler,
  listLowStockMedicamentsHandler,
  listMedicamentsHandler,
  recordStockMovementHandler,
  updateMedicamentHandler,
} from "./medicaments.controller";

const router = Router();

router.use(verifyJWT);

router.get("/", listMedicamentsHandler);
router.get("/alerts/low-stock", listLowStockMedicamentsHandler);
router.get("/alerts/expiring", listExpiringMedicamentsHandler);
router.get("/:id", getMedicamentByIdHandler);
router.post("/:id/movements", verifyRole("ADMIN", "SECRETAIRE"), recordStockMovementHandler);
router.post("/", verifyRole("ADMIN", "SECRETAIRE"), createMedicamentHandler);
router.patch("/:id", verifyRole("ADMIN", "SECRETAIRE"), updateMedicamentHandler);
router.delete("/:id", verifyRole("ADMIN"), deleteMedicamentHandler);

export default router;
