import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch } from "../lib/api";

type StatutRdv = "PLANIFIE" | "CONFIRME" | "EN_COURS" | "TERMINE" | "ANNULE" | "ABSENT";

interface RendezVousItem {
  id: string;
  patientId: string;
  medecinId: string;
  dateHeure: string;
  duree: number;
  motif?: string;
  statut: StatutRdv;
  notes?: string;
  patient?: {
    id: string;
    nom: string;
    prenom: string;
    numeroDossier: string;
  };
  medecin?: {
    id: string;
    nom: string;
    prenom: string;
    specialite: string;
  };
}

interface RendezVousResponse {
  items: RendezVousItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CreateRendezVousPayload {
  patientId: string;
  medecinId: string;
  dateHeure: string;
  duree: number;
  motif: string;
  statut: StatutRdv;
  notes: string;
}

interface Filters {
  patientId: string;
  medecinId: string;
  statut: "" | StatutRdv;
  from: string;
  to: string;
}

const statusOptions: Array<{ value: StatutRdv; label: string }> = [
  { value: "PLANIFIE", label: "Planifie" },
  { value: "CONFIRME", label: "Confirme" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINE", label: "Termine" },
  { value: "ANNULE", label: "Annule" },
  { value: "ABSENT", label: "Absent" },
];

const initialForm: CreateRendezVousPayload = {
  patientId: "",
  medecinId: "",
  dateHeure: "",
  duree: 30,
  motif: "",
  statut: "PLANIFIE",
  notes: "",
};

const initialFilters: Filters = {
  patientId: "",
  medecinId: "",
  statut: "",
  from: "",
  to: "",
};

function toDateOnly(value: string) {
  return value ? value.slice(0, 10) : "";
}

function toIsoDatetime(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function formatDatetime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getStatusBadgeClass(statut: StatutRdv) {
  switch (statut) {
    case "TERMINE":
      return "bg-emerald-100 text-emerald-700";
    case "CONFIRME":
      return "bg-blue-100 text-blue-700";
    case "EN_COURS":
      return "bg-amber-100 text-amber-700";
    case "ANNULE":
    case "ABSENT":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function RendezVousPage() {
  const [rendezvous, setRendezvous] = useState<RendezVousItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [form, setForm] = useState<CreateRendezVousPayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const unauthorized = useMemo(() => error?.includes("401") || error?.includes("Token") || false, [error]);

  const loadRendezVous = useCallback(async (activeFilters: Filters) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<RendezVousResponse>("/api/rendezvous", {
        query: {
          patientId: activeFilters.patientId || undefined,
          medecinId: activeFilters.medecinId || undefined,
          statut: activeFilters.statut || undefined,
          from: toDateOnly(activeFilters.from) || undefined,
          to: toDateOnly(activeFilters.to) || undefined,
        },
      });
      setRendezvous(data.items);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors du chargement des rendez-vous");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRendezVous(initialFilters);
  }, [loadRendezVous]);

  async function handleCreateRendezVous(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch<RendezVousItem>("/api/rendezvous", {
        method: "POST",
        body: {
          patientId: form.patientId,
          medecinId: form.medecinId,
          dateHeure: toIsoDatetime(form.dateHeure),
          duree: form.duree,
          motif: form.motif || undefined,
          statut: form.statut,
          notes: form.notes || undefined,
        },
      });

      setForm(initialForm);
      await loadRendezVous(filters);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors de la creation du rendez-vous");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus(id: string, statut: StatutRdv) {
    setError(null);

    try {
      await apiFetch<RendezVousItem>(`/api/rendezvous/${id}`, {
        method: "PATCH",
        body: { statut },
      });
      await loadRendezVous(filters);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors de la mise a jour du statut");
      }
    }
  }

  async function handleDeleteRendezVous(id: string) {
    setError(null);

    try {
      await apiFetch<void>(`/api/rendezvous/${id}`, { method: "DELETE" });
      await loadRendezVous(filters);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors de la suppression du rendez-vous");
      }
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Rendez-vous</h1>
        <p className="text-sm text-slate-600">Planification, suivi du statut et gestion des rendez-vous</p>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          {unauthorized ? " - Connecte-toi avec un vrai token backend pour acceder aux endpoints securises." : ""}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Filtres</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <input
            placeholder="Patient ID"
            value={filters.patientId}
            onChange={(event) => setFilters((prev) => ({ ...prev, patientId: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Medecin ID"
            value={filters.medecinId}
            onChange={(event) => setFilters((prev) => ({ ...prev, medecinId: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={filters.statut}
            onChange={(event) => setFilters((prev) => ({ ...prev, statut: event.target.value as Filters["statut"] }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Tous les statuts</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void loadRendezVous(filters)}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm text-white"
          >
            Rechercher
          </button>
          <button
            type="button"
            onClick={() => {
              setFilters(initialFilters);
              void loadRendezVous(initialFilters);
            }}
            className="rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            Reinitialiser
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Nouveau rendez-vous</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateRendezVous}>
          <input
            placeholder="Patient ID"
            value={form.patientId}
            onChange={(event) => setForm((prev) => ({ ...prev, patientId: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Medecin ID"
            value={form.medecinId}
            onChange={(event) => setForm((prev) => ({ ...prev, medecinId: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="datetime-local"
            value={form.dateHeure}
            onChange={(event) => setForm((prev) => ({ ...prev, dateHeure: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            min={5}
            max={480}
            value={form.duree}
            onChange={(event) => setForm((prev) => ({ ...prev, duree: Number(event.target.value) }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Motif"
            value={form.motif}
            onChange={(event) => setForm((prev) => ({ ...prev, motif: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={form.statut}
            onChange={(event) => setForm((prev) => ({ ...prev, statut: event.target.value as StatutRdv }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
          >
            {submitting ? "Creation..." : "Ajouter rendez-vous"}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Patient</th>
              <th className="px-3 py-2">Medecin</th>
              <th className="px-3 py-2">Motif</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={6}>
                  Chargement...
                </td>
              </tr>
            ) : rendezvous.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={6}>
                  Aucun rendez-vous trouve
                </td>
              </tr>
            ) : (
              rendezvous.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{formatDatetime(item.dateHeure)} ({item.duree} min)</td>
                  <td className="px-3 py-2">{item.patient ? `${item.patient.prenom} ${item.patient.nom}` : item.patientId}</td>
                  <td className="px-3 py-2">{item.medecin ? `Dr ${item.medecin.prenom} ${item.medecin.nom}` : item.medecinId}</td>
                  <td className="px-3 py-2">{item.motif || "-"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(item.statut)}`}>
                      {item.statut}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={item.statut}
                        onChange={(event) => void handleUpdateStatus(item.id, event.target.value as StatutRdv)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleDeleteRendezVous(item.id)}
                        className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
