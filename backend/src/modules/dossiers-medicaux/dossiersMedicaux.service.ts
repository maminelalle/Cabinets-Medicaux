import type { DossierMedical, Prisma } from "@prisma/client";

import { prisma } from "../../prisma/client";

export interface ListDossiersMedicauxParams {
  page?: number;
  limit?: number;
  patientId?: string;
  type?: string;
  query?: string;
}

export interface CreateDossierMedicalInput {
  patientId: string;
  titre: string;
  type: string;
  fichierUrl?: string;
  notes?: string;
}

export interface UpdateDossierMedicalInput {
  patientId?: string;
  titre?: string;
  type?: string;
  fichierUrl?: string;
  notes?: string;
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

async function assertPatientExists(patientId: string) {
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!patient) {
    throw new Error("Patient introuvable ou inactif");
  }
}

export async function listDossiersMedicaux(params: ListDossiersMedicauxParams) {
  const { page, limit, patientId, type, query } = params;
  const { skip, page: currentPage, limit: currentLimit } = computePagination(page, limit);

  const where: Prisma.DossierMedicalWhereInput = {
    ...(patientId ? { patientId } : {}),
    ...(type ? { type: { contains: type, mode: "insensitive" } } : {}),
    ...(query
      ? {
          OR: [
            { titre: { contains: query, mode: "insensitive" } },
            { type: { contains: query, mode: "insensitive" } },
            { notes: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.dossierMedical.findMany({
      where,
      skip,
      take: currentLimit,
      orderBy: { createdAt: "desc" },
      include: {
        patient: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            numeroDossier: true,
          },
        },
      },
    }),
    prisma.dossierMedical.count({ where }),
  ]);

  return {
    items,
    page: currentPage,
    limit: currentLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / currentLimit)),
  };
}

export async function getDossierMedicalById(id: string) {
  return prisma.dossierMedical.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          numeroDossier: true,
        },
      },
    },
  });
}

export async function createDossierMedical(input: CreateDossierMedicalInput): Promise<DossierMedical> {
  await assertPatientExists(input.patientId);

  return prisma.dossierMedical.create({
    data: {
      patientId: input.patientId,
      titre: input.titre,
      type: input.type,
      fichierUrl: input.fichierUrl,
      notes: input.notes,
    },
  });
}

export async function updateDossierMedical(id: string, input: UpdateDossierMedicalInput): Promise<DossierMedical | null> {
  const existing = await prisma.dossierMedical.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  if (input.patientId) {
    await assertPatientExists(input.patientId);
  }

  return prisma.dossierMedical.update({
    where: { id },
    data: {
      ...(input.patientId !== undefined ? { patientId: input.patientId } : {}),
      ...(input.titre !== undefined ? { titre: input.titre } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.fichierUrl !== undefined ? { fichierUrl: input.fichierUrl } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}

export async function deleteDossierMedical(id: string) {
  const result = await prisma.dossierMedical.deleteMany({
    where: { id },
  });

  return result.count > 0;
}
