import type { Medecin, Prisma } from "@prisma/client";

import { prisma } from "../../prisma/client";

export interface ListMedecinsParams {
  page?: number;
  limit?: number;
  query?: string;
  specialite?: string;
  statut?: "ACTIF" | "INACTIF";
}

export interface CreateMedecinInput {
  compteId: string;
  nom: string;
  prenom: string;
  specialite: string;
  telephone?: string;
  numeroOrdre?: string;
  formation?: string;
  experience?: string;
  disponibilites?: Prisma.InputJsonValue;
  statut?: boolean;
}

export interface UpdateMedecinInput {
  nom?: string;
  prenom?: string;
  specialite?: string;
  telephone?: string;
  numeroOrdre?: string;
  formation?: string;
  experience?: string;
  disponibilites?: Prisma.InputJsonValue;
  statut?: boolean;
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

function buildStatutFilter(statut?: "ACTIF" | "INACTIF") {
  if (!statut) {
    return undefined;
  }

  return statut === "ACTIF";
}

export async function listMedecins(params: ListMedecinsParams) {
  const { page, limit, query, specialite, statut } = params;
  const { skip, page: currentPage, limit: currentLimit } = computePagination(page, limit);

  const where: Prisma.MedecinWhereInput = {
    ...(query
      ? {
          OR: [
            { nom: { contains: query, mode: "insensitive" } },
            { prenom: { contains: query, mode: "insensitive" } },
            { numeroOrdre: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(specialite
      ? {
          specialite: { contains: specialite, mode: "insensitive" },
        }
      : {}),
    ...(statut ? { statut: buildStatutFilter(statut) } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.medecin.findMany({
      where,
      skip,
      take: currentLimit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        compte: {
          select: {
            id: true,
            email: true,
            role: true,
            statut: true,
          },
        },
      },
    }),
    prisma.medecin.count({ where }),
  ]);

  return {
    items,
    page: currentPage,
    limit: currentLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / currentLimit)),
  };
}

export async function getMedecinById(id: string) {
  return prisma.medecin.findUnique({
    where: { id },
    include: {
      compte: {
        select: {
          id: true,
          email: true,
          role: true,
          statut: true,
        },
      },
    },
  });
}

export async function createMedecin(input: CreateMedecinInput): Promise<Medecin> {
  const compte = await prisma.compte.findUnique({
    where: { id: input.compteId },
    select: { id: true, role: true },
  });

  if (!compte) {
    throw new Error("Compte introuvable");
  }

  if (compte.role !== "MEDECIN") {
    throw new Error("Le compte doit avoir le role MEDECIN");
  }

  return prisma.medecin.create({
    data: {
      compteId: input.compteId,
      nom: input.nom,
      prenom: input.prenom,
      specialite: input.specialite,
      telephone: input.telephone,
      numeroOrdre: input.numeroOrdre,
      formation: input.formation,
      experience: input.experience,
      disponibilites: input.disponibilites,
      statut: input.statut ?? true,
    },
  });
}

export async function updateMedecin(id: string, input: UpdateMedecinInput): Promise<Medecin | null> {
  const existing = await prisma.medecin.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return prisma.medecin.update({
    where: { id },
    data: {
      ...(input.nom !== undefined ? { nom: input.nom } : {}),
      ...(input.prenom !== undefined ? { prenom: input.prenom } : {}),
      ...(input.specialite !== undefined ? { specialite: input.specialite } : {}),
      ...(input.telephone !== undefined ? { telephone: input.telephone } : {}),
      ...(input.numeroOrdre !== undefined ? { numeroOrdre: input.numeroOrdre } : {}),
      ...(input.formation !== undefined ? { formation: input.formation } : {}),
      ...(input.experience !== undefined ? { experience: input.experience } : {}),
      ...(input.disponibilites !== undefined ? { disponibilites: input.disponibilites } : {}),
      ...(input.statut !== undefined ? { statut: input.statut } : {}),
    },
  });
}

export async function deactivateMedecin(id: string) {
  const result = await prisma.medecin.updateMany({
    where: {
      id,
      statut: true,
    },
    data: {
      statut: false,
    },
  });

  return result.count > 0;
}
