import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";
import { verifyRole } from "../../middlewares/verifyRole";

import { getCabinetSettingsHandler, updateCabinetSettingsHandler } from "./cabinetSettings.controller";

const router = Router();

router.use(verifyJWT);
router.use(verifyRole("ADMIN"));

router.get("/", getCabinetSettingsHandler);
router.put("/", updateCabinetSettingsHandler);

export default router;
