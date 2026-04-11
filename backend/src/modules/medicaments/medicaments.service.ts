import type { Medicament, MouvementStock, Prisma } from "@prisma/client";

import { prisma } from "../../prisma/client";

export interface ListMedicamentsParams {
  page?: number;
  limit?: number;
  query?: string;
  lowStockOnly?: boolean;
  expiredOnly?: boolean;
  expiringSoonDays?: number;
}

export interface CreateMedicamentInput {
  nom: string;
  forme?: string;
  dosage?: string;
  stockActuel?: number;
  seuilAlerte?: number;
  dateExpiration?: string;
}

export interface UpdateMedicamentInput {
  nom?: string;
  forme?: string;
  dosage?: string;
  stockActuel?: number;
  seuilAlerte?: number;
  dateExpiration?: string;
}

export interface RecordStockMovementInput {
  medicamentId: string;
  type: "ENTREE" | "SORTIE";
  quantite: number;
  motif?: string;
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

function toDateAtStartOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getExpiryThreshold(days: number) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);
  return threshold;
}

export async function listMedicaments(params: ListMedicamentsParams) {
  const { page, limit, query, lowStockOnly, expiredOnly, expiringSoonDays } = params;
  const { skip, page: currentPage, limit: currentLimit } = computePagination(page, limit);
  const today = toDateAtStartOfDay(new Date());
  const soonThreshold = expiringSoonDays && expiringSoonDays > 0 ? getExpiryThreshold(expiringSoonDays) : null;

  const where: Prisma.MedicamentWhereInput = {
    ...(query
      ? {
          OR: [
            { nom: { contains: query, mode: "insensitive" } },
            { forme: { contains: query, mode: "insensitive" } },
            { dosage: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(expiredOnly
      ? {
          dateExpiration: {
            lt: today,
          },
        }
      : {}),
    ...(soonThreshold
      ? {
          dateExpiration: {
            gte: today,
            lte: soonThreshold,
          },
        }
      : {}),
  };

  if (lowStockOnly) {
    const items = await prisma.medicament.findMany({
      where,
      orderBy: [{ stockActuel: "asc" }, { createdAt: "desc" }],
      include: {
        mouvements: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    const filtered = items.filter((item) => item.stockActuel <= item.seuilAlerte);
    const pagedItems = filtered.slice(skip, skip + currentLimit);

    return {
      items: pagedItems,
      page: currentPage,
      limit: currentLimit,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / currentLimit)),
    };
  }

  const [items, total] = await prisma.$transaction([
    prisma.medicament.findMany({
      where,
      skip,
      take: currentLimit,
      orderBy: [{ stockActuel: "asc" }, { createdAt: "desc" }],
      include: {
        mouvements: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    }),
    prisma.medicament.count({ where }),
  ]);

  return {
    items,
    page: currentPage,
    limit: currentLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / currentLimit)),
  };
}

export async function getMedicamentById(id: string) {
  return prisma.medicament.findUnique({
    where: { id },
    include: {
      mouvements: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createMedicament(input: CreateMedicamentInput): Promise<Medicament> {
  return prisma.medicament.create({
    data: {
      nom: input.nom,
      forme: input.forme,
      dosage: input.dosage,
      stockActuel: input.stockActuel ?? 0,
      seuilAlerte: input.seuilAlerte ?? 10,
      dateExpiration: input.dateExpiration ? new Date(input.dateExpiration) : undefined,
    },
  });
}

export async function updateMedicament(id: string, input: UpdateMedicamentInput): Promise<Medicament | null> {
  const existing = await prisma.medicament.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return prisma.medicament.update({
    where: { id },
    data: {
      ...(input.nom !== undefined ? { nom: input.nom } : {}),
      ...(input.forme !== undefined ? { forme: input.forme } : {}),
      ...(input.dosage !== undefined ? { dosage: input.dosage } : {}),
      ...(input.stockActuel !== undefined ? { stockActuel: input.stockActuel } : {}),
      ...(input.seuilAlerte !== undefined ? { seuilAlerte: input.seuilAlerte } : {}),
      ...(input.dateExpiration !== undefined ? { dateExpiration: new Date(input.dateExpiration) } : {}),
    },
  });
}

export async function deleteMedicament(id: string) {
  const result = await prisma.medicament.deleteMany({
    where: { id },
  });

  return result.count > 0;
}

export async function listLowStockMedicaments() {
  const items = await prisma.medicament.findMany({
    orderBy: [{ stockActuel: "asc" }, { createdAt: "desc" }],
  });

  return items.filter((item) => item.stockActuel <= item.seuilAlerte);
}

export async function listExpiringMedicaments(days = 30) {
  const now = new Date();
  const threshold = getExpiryThreshold(days);

  return prisma.medicament.findMany({
    where: {
      dateExpiration: {
        gte: now,
        lte: threshold,
      },
    },
    orderBy: { dateExpiration: "asc" },
  });
}

export async function recordStockMovement(input: RecordStockMovementInput): Promise<MouvementStock> {
  const medicament = await prisma.medicament.findUnique({
    where: { id: input.medicamentId },
    select: { id: true, stockActuel: true, nom: true },
  });

  if (!medicament) {
    throw new Error("Médicament introuvable");
  }

  const delta = input.type === "ENTREE" ? input.quantite : -input.quantite;
  const nextStock = medicament.stockActuel + delta;

  if (nextStock < 0) {
    throw new Error(`Stock insuffisant pour ${medicament.nom}`);
  }

  return prisma.$transaction(async (tx) => {
    const movement = await tx.mouvementStock.create({
      data: {
        medicamentId: medicament.id,
        type: input.type,
        quantite: input.quantite,
        motif: input.motif,
      },
    });

    await tx.medicament.update({
      where: { id: medicament.id },
      data: {
        stockActuel: nextStock,
      },
    });

    return movement;
  });
}
