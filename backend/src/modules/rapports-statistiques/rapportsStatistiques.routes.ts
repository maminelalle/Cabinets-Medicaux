import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";
import { verifyRole } from "../../middlewares/verifyRole";

import { getDashboardStatsHandler } from "./rapportsStatistiques.controller";

const router = Router();

router.use(verifyJWT);

router.get("/dashboard", verifyRole("ADMIN", "MEDECIN", "SECRETAIRE"), getDashboardStatsHandler);

export default router;
