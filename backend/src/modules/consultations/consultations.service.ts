import type { Consultation, Prisma } from "@prisma/client";

import { prisma } from "../../prisma/client";

export interface ListConsultationsParams {
  page?: number;
  limit?: number;
  patientId?: string;
  medecinId?: string;
  rdvId?: string;
  from?: string;
  to?: string;
}

export interface CreateConsultationInput {
  rdvId: string;
  patientId: string;
  medecinId: string;
  motif: string;
  symptomes?: string;
  diagnostic?: string;
  traitement?: string;
  tensionArterielle?: string;
  poids?: number;
  temperature?: number;
  notes?: string;
}

export interface UpdateConsultationInput {
  motif?: string;
  symptomes?: string;
  diagnostic?: string;
  traitement?: string;
  tensionArterielle?: string;
  poids?: number;
  temperature?: number;
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

async function assertConsultationIntegrity(input: CreateConsultationInput) {
  const [rdv, patient, medecin, existingConsultation] = await prisma.$transaction([
    prisma.rendezVous.findUnique({
      where: { id: input.rdvId },
      select: {
        id: true,
        patientId: true,
        medecinId: true,
        statut: true,
      },
    }),
    prisma.patient.findFirst({
      where: { id: input.patientId, deletedAt: null },
      select: { id: true },
    }),
    prisma.medecin.findFirst({
      where: { id: input.medecinId, statut: true },
      select: { id: true },
    }),
    prisma.consultation.findUnique({
      where: { rdvId: input.rdvId },
      select: { id: true },
    }),
  ]);

  if (!rdv) {
    throw new Error("Rendez-vous introuvable");
  }

  if (!patient) {
    throw new Error("Patient introuvable ou inactif");
  }

  if (!medecin) {
    throw new Error("Médecin introuvable ou inactif");
  }

  if (existingConsultation) {
    throw new Error("Une consultation existe déjà pour ce rendez-vous");
  }

  if (rdv.patientId !== input.patientId || rdv.medecinId !== input.medecinId) {
    throw new Error("Le patient ou le médecin ne correspond pas au rendez-vous");
  }
}

export async function listConsultations(params: ListConsultationsParams) {
  const { page, limit, patientId, medecinId, rdvId, from, to } = params;
  const { skip, page: currentPage, limit: currentLimit } = computePagination(page, limit);

  const where: Prisma.ConsultationWhereInput = {
    ...(patientId ? { patientId } : {}),
    ...(medecinId ? { medecinId } : {}),
    ...(rdvId ? { rdvId } : {}),
    ...((from || to)
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.consultation.findMany({
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
        medecin: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            specialite: true,
          },
        },
        rendezvous: {
          select: {
            id: true,
            dateHeure: true,
            statut: true,
          },
        },
      },
    }),
    prisma.consultation.count({ where }),
  ]);

  return {
    items,
    page: currentPage,
    limit: currentLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / currentLimit)),
  };
}

export async function getConsultationById(id: string) {
  return prisma.consultation.findUnique({
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
      rendezvous: {
        select: {
          id: true,
          dateHeure: true,
          statut: true,
          notes: true,
        },
      },
    },
  });
}

export async function createConsultation(input: CreateConsultationInput): Promise<Consultation> {
  await assertConsultationIntegrity(input);

  return prisma.$transaction(async (tx) => {
    const consultation = await tx.consultation.create({
      data: {
        rdvId: input.rdvId,
        patientId: input.patientId,
        medecinId: input.medecinId,
        motif: input.motif,
        symptomes: input.symptomes,
        diagnostic: input.diagnostic,
        traitement: input.traitement,
        tensionArterielle: input.tensionArterielle,
        poids: input.poids,
        temperature: input.temperature,
        notes: input.notes,
      },
    });

    await tx.rendezVous.update({
      where: { id: input.rdvId },
      data: {
        statut: "TERMINE",
      },
    });

    return consultation;
  });
}

export async function updateConsultation(id: string, input: UpdateConsultationInput): Promise<Consultation | null> {
  const existing = await prisma.consultation.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return prisma.consultation.update({
    where: { id },
    data: {
      ...(input.motif !== undefined ? { motif: input.motif } : {}),
      ...(input.symptomes !== undefined ? { symptomes: input.symptomes } : {}),
      ...(input.diagnostic !== undefined ? { diagnostic: input.diagnostic } : {}),
      ...(input.traitement !== undefined ? { traitement: input.traitement } : {}),
      ...(input.tensionArterielle !== undefined ? { tensionArterielle: input.tensionArterielle } : {}),
      ...(input.poids !== undefined ? { poids: input.poids } : {}),
      ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}

export async function deleteConsultation(id: string) {
  const result = await prisma.consultation.deleteMany({
    where: { id },
  });

  return result.count > 0;
}
