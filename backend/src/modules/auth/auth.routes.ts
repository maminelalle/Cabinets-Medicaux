import { Router } from "express";

import { loginRateLimiter } from "../../middlewares/rateLimiter";
import { validate } from "../../middlewares/validate";
import { verifyJWT } from "../../middlewares/verifyJWT";

import { loginHandler, logoutHandler, refreshHandler } from "./auth.controller";
import { loginSchema, refreshSchema } from "./auth.schema";

const router = Router();

router.post("/login", loginRateLimiter, validate(loginSchema), loginHandler);
router.post("/refresh", validate(refreshSchema), refreshHandler);
router.post("/logout", verifyJWT, logoutHandler);

export default router;
