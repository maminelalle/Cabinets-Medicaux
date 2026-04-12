import type { Role, StatutCompte } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import * as adminUsersService from "./adminUsers.service";

const roleValues = ["ADMIN", "MEDECIN", "SECRETAIRE"] as const;
const statutValues = ["ACTIF", "INACTIF", "SUSPENDU"] as const;

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  role: z.enum(roleValues).optional(),
  statut: z.enum(statutValues).optional(),
  q: z.string().trim().min(1).optional(),
});

const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(roleValues),
  statut: z.enum(statutValues).optional(),
});

const updateUserSchema = z.object({
  email: z.string().trim().email().optional(),
  role: z.enum(roleValues).optional(),
  statut: z.enum(statutValues).optional(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

function getParamId(req: Request) {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

export async function listAdminUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Paramètres de recherche invalides" });
      return;
    }

    const result = await adminUsersService.listAdminUsers({
      page: parsed.data.page,
      limit: parsed.data.limit,
      role: parsed.data.role as Role | undefined,
      statut: parsed.data.statut as StatutCompte | undefined,
      query: parsed.data.q,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAdminUserByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await adminUsersService.getAdminUserById(getParamId(req));
    if (!user) {
      res.status(404).json({ message: "Utilisateur introuvable" });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function createAdminUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const created = await adminUsersService.createAdminUser({
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role as Role,
      statut: parsed.data.statut as StatutCompte | undefined,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updateAdminUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const updated = await adminUsersService.updateAdminUser(getParamId(req), {
      email: parsed.data.email,
      role: parsed.data.role as Role | undefined,
      statut: parsed.data.statut as StatutCompte | undefined,
    });

    if (!updated) {
      res.status(404).json({ message: "Utilisateur introuvable" });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function resetAdminUserPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Corps de requête invalide" });
      return;
    }

    const success = await adminUsersService.resetAdminUserPassword(getParamId(req), parsed.data.password);
    if (!success) {
      res.status(404).json({ message: "Utilisateur introuvable" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function suspendAdminUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const success = await adminUsersService.suspendAdminUser(getParamId(req));
    if (!success) {
      res.status(404).json({ message: "Utilisateur introuvable ou déjà suspendu" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
