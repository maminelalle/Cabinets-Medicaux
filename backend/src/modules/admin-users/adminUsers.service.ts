import type { Compte, Prisma, Role, StatutCompte } from "@prisma/client";
import bcrypt from "bcrypt";

import { prisma } from "../../prisma/client";

export interface ListAdminUsersParams {
  page?: number;
  limit?: number;
  role?: Role;
  statut?: StatutCompte;
  query?: string;
}

export interface CreateAdminUserInput {
  email: string;
  password: string;
  role: Role;
  statut?: StatutCompte;
}

export interface UpdateAdminUserInput {
  email?: string;
  role?: Role;
  statut?: StatutCompte;
}

function computePagination(page = 1, limit = 20) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

function sanitizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function listAdminUsers(params: ListAdminUsersParams) {
  const { page, limit, role, statut, query } = params;
  const { page: currentPage, limit: currentLimit, skip } = computePagination(page, limit);

  const where: Prisma.CompteWhereInput = {
    ...(role ? { role } : {}),
    ...(statut ? { statut } : {}),
    ...(query
      ? {
          OR: [{ email: { contains: query, mode: "insensitive" } }],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.compte.findMany({
      where,
      skip,
      take: currentLimit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        statut: true,
        createdAt: true,
        updatedAt: true,
        medecin: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            specialite: true,
          },
        },
        personnel: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            poste: true,
          },
        },
      },
    }),
    prisma.compte.count({ where }),
  ]);

  return {
    items,
    page: currentPage,
    limit: currentLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / currentLimit)),
  };
}

export async function getAdminUserById(id: string) {
  return prisma.compte.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      statut: true,
      createdAt: true,
      updatedAt: true,
      medecin: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          specialite: true,
        },
      },
      personnel: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          poste: true,
        },
      },
    },
  });
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<Omit<Compte, "motDePasse">> {
  const email = sanitizeEmail(input.email);
  const existing = await prisma.compte.findUnique({ where: { email }, select: { id: true } });

  if (existing) {
    throw new Error("Un compte avec cet email existe déjà");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const created = await prisma.compte.create({
    data: {
      email,
      motDePasse: hashedPassword,
      role: input.role,
      statut: input.statut ?? "ACTIF",
    },
  });

  const { motDePasse: _ignored, ...safeCompte } = created;
  return safeCompte;
}

export async function updateAdminUser(id: string, input: UpdateAdminUserInput) {
  const existing = await prisma.compte.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return null;
  }

  return prisma.compte.update({
    where: { id },
    data: {
      ...(input.email !== undefined ? { email: sanitizeEmail(input.email) } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.statut !== undefined ? { statut: input.statut } : {}),
    },
    select: {
      id: true,
      email: true,
      role: true,
      statut: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function resetAdminUserPassword(id: string, newPassword: string) {
  const existing = await prisma.compte.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return false;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.compte.update({
    where: { id },
    data: { motDePasse: hashedPassword },
  });

  return true;
}

export async function suspendAdminUser(id: string) {
  const result = await prisma.compte.updateMany({
    where: { id, statut: { not: "SUSPENDU" } },
    data: { statut: "SUSPENDU" },
  });

  return result.count > 0;
}
