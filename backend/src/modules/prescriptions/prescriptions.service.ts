import type { Prescription, Prisma } from "@prisma/client";

import { prisma } from "../../prisma/client";

export interface ListPrescriptionsParams {
  page?: number;
  limit?: number;
  consultationId?: string;
  patientId?: string;
  medecinId?: string;
}

export interface CreatePrescriptionItemInput {
  medicamentId: string;
  posologie: string;
  duree: string;
  quantite: number;
}

export interface CreatePrescriptionInput {
  consultationId: string;
  notes?: string;
  items: CreatePrescriptionItemInput[];
}

export interface UpdatePrescriptionInput {
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

async function assertPrescriptionIntegrity(input: CreatePrescriptionInput) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
    select: {
      id: true,
      patientId: true,
      medecinId: true,
    },
  });

  if (!consultation) {
    throw new Error("Consultation introuvable");
  }

  const existingPrescription = await prisma.prescription.findFirst({
    where: { consultationId: input.consultationId },
    select: { id: true },
  });

  if (existingPrescription) {
    throw new Error("Une prescription existe déjà pour cette consultation");
  }

  return consultation;
}

async function assertStockAvailability(items: CreatePrescriptionItemInput[]) {
  const medicamentIds = [...new Set(items.map((item) => item.medicamentId))];

  const medicaments = await prisma.medicament.findMany({
    where: { id: { in: medicamentIds } },
    select: {
      id: true,
      nom: true,
      stockActuel: true,
    },
  });

  if (medicaments.length !== medicamentIds.length) {
    throw new Error("Un ou plusieurs médicaments sont introuvables");
  }

  const byId = new Map(medicaments.map((m) => [m.id, m]));

  for (const item of items) {
    const medicament = byId.get(item.medicamentId);
    if (!medicament) {
      throw new Error("Médicament introuvable");
    }

    if (medicament.stockActuel < item.quantite) {
      throw new Error(`Stock insuffisant pour ${medicament.nom}`);
    }
  }
}

export async function listPrescriptions(params: ListPrescriptionsParams) {
  const { page, limit, consultationId, patientId, medecinId } = params;
  const { skip, page: currentPage, limit: currentLimit } = computePagination(page, limit);

  const where: Prisma.PrescriptionWhereInput = {
    ...(consultationId ? { consultationId } : {}),
    ...((patientId || medecinId)
      ? {
          consultation: {
            ...(patientId ? { patientId } : {}),
            ...(medecinId ? { medecinId } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.prescription.findMany({
      where,
      skip,
      take: currentLimit,
      orderBy: { createdAt: "desc" },
      include: {
        consultation: {
          select: {
            id: true,
            patientId: true,
            medecinId: true,
            motif: true,
          },
        },
        items: {
          include: {
            medicament: {
              select: {
                id: true,
                nom: true,
                forme: true,
                dosage: true,
              },
            },
          },
        },
      },
    }),
    prisma.prescription.count({ where }),
  ]);

  return {
    items,
    page: currentPage,
    limit: currentLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / currentLimit)),
  };
}

export async function getPrescriptionById(id: string) {
  return prisma.prescription.findUnique({
    where: { id },
    include: {
      consultation: {
        select: {
          id: true,
          patientId: true,
          medecinId: true,
          motif: true,
          createdAt: true,
        },
      },
      items: {
        include: {
          medicament: {
            select: {
              id: true,
              nom: true,
              forme: true,
              dosage: true,
            },
          },
        },
      },
    },
  });
}

export async function createPrescription(input: CreatePrescriptionInput): Promise<Prescription> {
  await assertPrescriptionIntegrity(input);
  await assertStockAvailability(input.items);

  return prisma.$transaction(async (tx) => {
    const prescription = await tx.prescription.create({
      data: {
        consultationId: input.consultationId,
        notes: input.notes,
      },
    });

    for (const item of input.items) {
      await tx.prescriptionItem.create({
        data: {
          prescriptionId: prescription.id,
          medicamentId: item.medicamentId,
          posologie: item.posologie,
          duree: item.duree,
          quantite: item.quantite,
        },
      });

      await tx.medicament.update({
        where: { id: item.medicamentId },
        data: {
          stockActuel: {
            decrement: item.quantite,
          },
        },
      });

      await tx.mouvementStock.create({
        data: {
          medicamentId: item.medicamentId,
          type: "SORTIE",
          quantite: item.quantite,
          motif: `Prescription ${prescription.id}`,
        },
      });
    }

    return prescription;
  });
}

export async function updatePrescription(id: string, input: UpdatePrescriptionInput): Promise<Prescription | null> {
  const existing = await prisma.prescription.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return prisma.prescription.update({
    where: { id },
    data: {
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}

export async function deletePrescription(id: string) {
  const result = await prisma.prescription.deleteMany({
    where: { id },
  });

  return result.count > 0;
}
