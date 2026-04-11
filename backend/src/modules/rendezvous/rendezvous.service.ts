import type { Prisma, RendezVous, StatutRDV } from "@prisma/client";

import { prisma } from "../../prisma/client";

export interface ListRendezVousParams {
  page?: number;
  limit?: number;
  patientId?: string;
  medecinId?: string;
  statut?: StatutRDV;
  from?: string;
  to?: string;
}

export interface CreateRendezVousInput {
  patientId: string;
  medecinId: string;
  dateHeure: string;
  duree?: number;
  motif?: string;
  statut?: StatutRDV;
  notes?: string;
}

export interface UpdateRendezVousInput {
  patientId?: string;
  medecinId?: string;
  dateHeure?: string;
  duree?: number;
  motif?: string;
  statut?: StatutRDV;
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

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

async function assertRendezVousIntegrity(patientId: string, medecinId: string) {
  const [patient, medecin] = await prisma.$transaction([
    prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: { id: true },
    }),
    prisma.medecin.findFirst({
      where: { id: medecinId, statut: true },
      select: { id: true },
    }),
  ]);

  if (!patient) {
    throw new Error("Patient introuvable ou inactif");
  }

  if (!medecin) {
    throw new Error("Médecin introuvable ou inactif");
  }
}

async function assertNoOverlap(params: {
  medecinId: string;
  dateHeure: Date;
  duree: number;
  excludeRdvId?: string;
}) {
  const endDate = addMinutes(params.dateHeure, params.duree);

  const candidateRdv = await prisma.rendezVous.findFirst({
    where: {
      medecinId: params.medecinId,
      statut: {
        notIn: ["ANNULE", "ABSENT", "TERMINE"],
      },
      ...(params.excludeRdvId ? { id: { not: params.excludeRdvId } } : {}),
    },
    select: {
      id: true,
      dateHeure: true,
      duree: true,
    },
    orderBy: {
      dateHeure: "asc",
    },
  });

  if (!candidateRdv) {
    return;
  }

  const existingStart = candidateRdv.dateHeure;
  const existingEnd = addMinutes(existingStart, candidateRdv.duree);
  const overlap = params.dateHeure < existingEnd && endDate > existingStart;

  if (overlap) {
    throw new Error("Conflit d'horaire pour ce médecin");
  }
}

export async function listRendezVous(params: ListRendezVousParams) {
  const { page, limit, patientId, medecinId, statut, from, to } = params;
  const { skip, page: currentPage, limit: currentLimit } = computePagination(page, limit);

  const where: Prisma.RendezVousWhereInput = {
    ...(patientId ? { patientId } : {}),
    ...(medecinId ? { medecinId } : {}),
    ...(statut ? { statut } : {}),
    ...((from || to)
      ? {
          dateHeure: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.rendezVous.findMany({
      where,
      skip,
      take: currentLimit,
      orderBy: { dateHeure: "asc" },
      include: {
        patient: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            numeroDossier: true,
          },
        },
        medecin: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            specialite: true,
          },
        },
      },
    }),
    prisma.rendezVous.count({ where }),
  ]);

  return {
    items,
    page: currentPage,
    limit: currentLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / currentLimit)),
  };
}

export async function getRendezVousById(id: string) {
  return prisma.rendezVous.findUnique({
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
      medecin: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          specialite: true,
        },
      },
    },
  });
}

export async function createRendezVous(input: CreateRendezVousInput): Promise<RendezVous> {
  const dateHeure = new Date(input.dateHeure);
  const duree = input.duree ?? 30;

  await assertRendezVousIntegrity(input.patientId, input.medecinId);
  await assertNoOverlap({ medecinId: input.medecinId, dateHeure, duree });

  return prisma.rendezVous.create({
    data: {
      patientId: input.patientId,
      medecinId: input.medecinId,
      dateHeure,
      duree,
      motif: input.motif,
      statut: input.statut ?? "PLANIFIE",
      notes: input.notes,
    },
  });
}

export async function updateRendezVous(id: string, input: UpdateRendezVousInput): Promise<RendezVous | null> {
  const existing = await prisma.rendezVous.findUnique({
    where: { id },
    select: {
      id: true,
      patientId: true,
      medecinId: true,
      dateHeure: true,
      duree: true,
    },
  });

  if (!existing) {
    return null;
  }

  const nextPatientId = input.patientId ?? existing.patientId;
  const nextMedecinId = input.medecinId ?? existing.medecinId;
  const nextDateHeure = input.dateHeure ? new Date(input.dateHeure) : existing.dateHeure;
  const nextDuree = input.duree ?? existing.duree;

  await assertRendezVousIntegrity(nextPatientId, nextMedecinId);
  await assertNoOverlap({
    medecinId: nextMedecinId,
    dateHeure: nextDateHeure,
    duree: nextDuree,
    excludeRdvId: id,
  });

  return prisma.rendezVous.update({
    where: { id },
    data: {
      ...(input.patientId !== undefined ? { patientId: input.patientId } : {}),
      ...(input.medecinId !== undefined ? { medecinId: input.medecinId } : {}),
      ...(input.dateHeure !== undefined ? { dateHeure: new Date(input.dateHeure) } : {}),
      ...(input.duree !== undefined ? { duree: input.duree } : {}),
      ...(input.motif !== undefined ? { motif: input.motif } : {}),
      ...(input.statut !== undefined ? { statut: input.statut } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}

export async function deleteRendezVous(id: string) {
  const result = await prisma.rendezVous.deleteMany({
    where: { id },
  });

  return result.count > 0;
}
