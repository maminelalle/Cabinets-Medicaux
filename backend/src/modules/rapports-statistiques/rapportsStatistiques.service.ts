import { StatutRDV } from "@prisma/client";

import { prisma } from "../../prisma/client";

export interface DashboardStatsParams {
  rangeDays?: number;
  expiringSoonDays?: number;
}

function getDateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function getDateDaysAhead(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function getStatusBuckets() {
  return Object.values(StatutRDV).reduce<Record<string, number>>((accumulator, status) => {
    accumulator[status] = 0;
    return accumulator;
  }, {});
}

function bucketByDay<T extends { createdAt: Date }>(items: T[], days: number) {
  const buckets: Array<{ date: string; count: number }> = [];
  const map = new Map<string, number>();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = getDateDaysAgo(index).toISOString().slice(0, 10);
    map.set(date, 0);
    buckets.push({ date, count: 0 });
  }

  for (const item of items) {
    const key = item.createdAt.toISOString().slice(0, 10);
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }

  return buckets.map((bucket) => ({
    ...bucket,
    count: map.get(bucket.date) ?? 0,
  }));
}

export async function getDashboardStats(params: DashboardStatsParams = {}) {
  const rangeDays = params.rangeDays && params.rangeDays > 0 ? Math.min(Math.floor(params.rangeDays), 365) : 30;
  const expiringSoonDays =
    params.expiringSoonDays && params.expiringSoonDays > 0 ? Math.min(Math.floor(params.expiringSoonDays), 365) : 30;

  const rangeStart = getDateDaysAgo(rangeDays);
  const expiringSoonThreshold = getDateDaysAhead(expiringSoonDays);

  const [patientsTotal, patientsActive, medecinsTotal, medecinsActive, consultationsTotal, prescriptionsTotal, patientsRecent, consultationsRecent, rendezVousRecent, prescriptionsRecent, lowStockMedicaments, expiringMedicaments, recentRendezVous] =
    await prisma.$transaction([
      prisma.patient.count(),
      prisma.patient.count({ where: { deletedAt: null } }),
      prisma.medecin.count(),
      prisma.medecin.count({ where: { statut: true } }),
      prisma.consultation.count(),
      prisma.prescription.count(),
      prisma.patient.findMany({
        where: { createdAt: { gte: rangeStart }, deletedAt: null },
        select: { createdAt: true },
      }),
      prisma.consultation.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
      prisma.rendezVous.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
      prisma.prescription.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
      prisma.medicament.findMany({
        where: {
          stockActuel: { lte: 10 },
        },
        select: { id: true },
      }),
      prisma.medicament.findMany({
        where: {
          dateExpiration: {
            gte: new Date(),
            lte: expiringSoonThreshold,
          },
        },
        select: { id: true },
      }),
      prisma.rendezVous.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          patient: {
            select: { id: true, nom: true, prenom: true, numeroDossier: true },
          },
          medecin: {
            select: { id: true, nom: true, prenom: true, specialite: true },
          },
        },
      }),
    ]);

  const rendezVousByStatus = getStatusBuckets();
  const rendezVousByStatusRows = await prisma.rendezVous.groupBy({
    by: ["statut"],
    _count: { _all: true },
  });

  for (const row of rendezVousByStatusRows) {
    rendezVousByStatus[row.statut] = row._count._all;
  }

  return {
    summary: {
      patientsTotal,
      patientsActive,
      medecinsTotal,
      medecinsActive,
      consultationsTotal,
      prescriptionsTotal,
      rendezVousTotal: await prisma.rendezVous.count(),
      lowStockMedicaments: lowStockMedicaments.length,
      expiringMedicaments: expiringMedicaments.length,
    },
    breakdown: {
      rendezVousByStatus: Object.entries(rendezVousByStatus).map(([status, count]) => ({ status, count })),
      patientsTrend: bucketByDay(patientsRecent, rangeDays),
      consultationsTrend: bucketByDay(consultationsRecent, rangeDays),
      rendezVousTrend: bucketByDay(rendezVousRecent, rangeDays),
      prescriptionsTrend: bucketByDay(prescriptionsRecent, rangeDays),
    },
    recentActivity: {
      rendezVous: recentRendezVous,
    },
  };
}
