import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";

import { rendezvousController } from "./rendezvous.controller";


const router = Router();

router.use(verifyJWT);

router.post("/", rendezvousController.create);
router.get("/:id", rendezvousController.getOne);

export default router;
