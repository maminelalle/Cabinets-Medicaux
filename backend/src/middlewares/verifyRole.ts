import type { NextFunction, Request, Response } from "express";

import type { JwtPayload } from "./verifyJWT";

export function verifyRole(...roles: JwtPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Accès refusé" });
      return;
    }
    next();
  };
}
