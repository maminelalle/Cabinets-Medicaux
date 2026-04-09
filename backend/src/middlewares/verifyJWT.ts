import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";

export interface JwtPayload {
  id: string;
  role: "ADMIN" | "MEDECIN" | "SECRETAIRE";
}

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token manquant" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
}
