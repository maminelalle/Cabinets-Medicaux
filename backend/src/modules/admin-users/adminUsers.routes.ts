import { Router } from "express";

import { verifyJWT } from "../../middlewares/verifyJWT";
import { verifyRole } from "../../middlewares/verifyRole";

import {
  createAdminUserHandler,
  getAdminUserByIdHandler,
  listAdminUsersHandler,
  resetAdminUserPasswordHandler,
  suspendAdminUserHandler,
  updateAdminUserHandler,
} from "./adminUsers.controller";

const router = Router();

router.use(verifyJWT);
router.use(verifyRole("ADMIN"));

router.get("/", listAdminUsersHandler);
router.get("/:id", getAdminUserByIdHandler);
router.post("/", createAdminUserHandler);
router.patch("/:id", updateAdminUserHandler);
router.patch("/:id/password", resetAdminUserPasswordHandler);
router.delete("/:id", suspendAdminUserHandler);

export default router;
