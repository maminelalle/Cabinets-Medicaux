import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validate = (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      res.status(400).json({ error: firstError.message });
      return;
    }
    req.body = result.data;
    next();
  };
