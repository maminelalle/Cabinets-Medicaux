import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";
import { verifyRole } from "../../middlewares/verifyRole";

import {
  createMedecinHandler,
  deactivateMedecinHandler,
  getMedecinByIdHandler,
  listMedecinsHandler,
  updateMedecinHandler,
} from "./medecins.controller";

const router = Router();

router.use(verifyJWT);

router.get("/", listMedecinsHandler);
router.get("/:id", getMedecinByIdHandler);

router.post("/", verifyRole("ADMIN"), createMedecinHandler);
router.patch("/:id", verifyRole("ADMIN"), updateMedecinHandler);
router.delete("/:id", verifyRole("ADMIN"), deactivateMedecinHandler);

export default router;
