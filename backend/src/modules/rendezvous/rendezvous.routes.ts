import { Router } from "express";

import { validate } from "../../middlewares/validate";
import { verifyJWT } from "../../middlewares/verifyJWT";

import { rendezvousController } from "./rendezvous.controller";
import { createRendezVousSchema, updateStatutSchema } from "./rendezvous.schema";

const router = Router();

router.use(verifyJWT);

router.post("/", validate(createRendezVousSchema), rendezvousController.create);
router.get("/", rendezvousController.getAll);
router.get("/:id", rendezvousController.getOne);
router.patch("/:id/statut", validate(updateStatutSchema), rendezvousController.updateStatut);

export default router;
