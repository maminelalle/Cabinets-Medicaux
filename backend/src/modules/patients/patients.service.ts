import type { Patient } from "@prisma/client";

import { prisma } from "../../prisma/client";

export interface ListPatientsParams {
  page?: number;
  limit?: number;
  query?: string;
}

export interface CreatePatientInput {
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string;
  nni: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  groupeSanguin?: string;
  antecedents?: string;
  allergies?: string;
}

export interface UpdatePatientInput {
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  sexe?: string;
  nni?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  groupeSanguin?: string;
  antecedents?: string;
  allergies?: string;
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

async function generateNumeroDossier() {
  const year = new Date().getFullYear();
  const prefix = `PAT-${year}-`;

  const latest = await prisma.patient.findFirst({
    where: {
      numeroDossier: {
        startsWith: prefix,
      },
    },
    orderBy: {
      numeroDossier: "desc",
    },
    select: {
      numeroDossier: true,
    },
  });

  const lastSequence = latest?.numeroDossier.split("-").pop();
  const next = (lastSequence ? Number.parseInt(lastSequence, 10) : 0) + 1;

  return `${prefix}${String(next).padStart(5, "0")}`;
}

export async function listPatients(params: ListPatientsParams) {
  const { page, limit, query } = params;
  const { skip, page: currentPage, limit: currentLimit } = computePagination(page, limit);

  const where = {
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { nom: { contains: query, mode: "insensitive" as const } },
            { prenom: { contains: query, mode: "insensitive" as const } },
            { numeroDossier: { contains: query, mode: "insensitive" as const } },
            { nni: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.patient.findMany({
      where,
      skip,
      take: currentLimit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.patient.count({ where }),
  ]);

  return {
    items,
    page: currentPage,
    limit: currentLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / currentLimit)),
  };
}

export async function getPatientById(id: string) {
  return prisma.patient.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
}

export async function createPatient(input: CreatePatientInput) {
  const numeroDossier = await generateNumeroDossier();

  return prisma.patient.create({
    data: {
      numeroDossier,
      nom: input.nom,
      prenom: input.prenom,
      dateNaissance: new Date(input.dateNaissance),
      sexe: input.sexe,
      nni: input.nni,
      telephone: input.telephone,
      email: input.email,
      adresse: input.adresse,
      groupeSanguin: input.groupeSanguin,
      antecedents: input.antecedents,
      allergies: input.allergies,
    },
  });
}

export async function updatePatient(id: string, input: UpdatePatientInput): Promise<Patient | null> {
  const existing = await prisma.patient.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return prisma.patient.update({
    where: { id },
    data: {
      ...(input.nom !== undefined ? { nom: input.nom } : {}),
      ...(input.prenom !== undefined ? { prenom: input.prenom } : {}),
      ...(input.dateNaissance !== undefined ? { dateNaissance: new Date(input.dateNaissance) } : {}),
      ...(input.sexe !== undefined ? { sexe: input.sexe } : {}),
      ...(input.nni !== undefined ? { nni: input.nni } : {}),
      ...(input.telephone !== undefined ? { telephone: input.telephone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.adresse !== undefined ? { adresse: input.adresse } : {}),
      ...(input.groupeSanguin !== undefined ? { groupeSanguin: input.groupeSanguin } : {}),
      ...(input.antecedents !== undefined ? { antecedents: input.antecedents } : {}),
      ...(input.allergies !== undefined ? { allergies: input.allergies } : {}),
    },
  });
}

export async function softDeletePatient(id: string) {
  const result = await prisma.patient.updateMany({
    where: {
      id,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return result.count > 0;
}
