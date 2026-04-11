import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";
import { verifyRole } from "../../middlewares/verifyRole";

import {
  createRendezVousHandler,
  deleteRendezVousHandler,
  getRendezVousByIdHandler,
  listRendezVousHandler,
  updateRendezVousHandler,
} from "./rendezvous.controller";

const router = Router();

router.use(verifyJWT);

router.get("/", listRendezVousHandler);
router.get("/:id", getRendezVousByIdHandler);

router.post("/", verifyRole("ADMIN", "SECRETAIRE"), createRendezVousHandler);
router.patch("/:id", verifyRole("ADMIN", "SECRETAIRE"), updateRendezVousHandler);
router.delete("/:id", verifyRole("ADMIN", "SECRETAIRE"), deleteRendezVousHandler);

export default router;
