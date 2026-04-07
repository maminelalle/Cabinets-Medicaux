import { Router } from "express";
import { loginRateLimiter } from "../../middlewares/rateLimiter";
import { verifyJWT } from "../../middlewares/verifyJWT";
import { loginHandler, logoutHandler, refreshHandler } from "./auth.controller";

const router = Router();

router.post("/login", loginRateLimiter, loginHandler);
router.post("/refresh", refreshHandler);
router.post("/logout", verifyJWT, logoutHandler);

export default router;
