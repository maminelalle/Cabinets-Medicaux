import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch } from "../lib/api";

interface ConsultationItem {
  id: string;
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
  createdAt: string;
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

interface ConsultationsResponse {
  items: ConsultationItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CreateConsultationPayload {
  rdvId: string;
  patientId: string;
  medecinId: string;
  motif: string;
  symptomes: string;
  diagnostic: string;
  traitement: string;
  tensionArterielle: string;
  poids: string;
  temperature: string;
  notes: string;
}

interface Filters {
  patientId: string;
  medecinId: string;
  rdvId: string;
  from: string;
  to: string;
}

const initialForm: CreateConsultationPayload = {
  rdvId: "",
  patientId: "",
  medecinId: "",
  motif: "",
  symptomes: "",
  diagnostic: "",
  traitement: "",
  tensionArterielle: "",
  poids: "",
  temperature: "",
  notes: "",
};

const initialFilters: Filters = {
  patientId: "",
  medecinId: "",
  rdvId: "",
  from: "",
  to: "",
};

function toDateOnly(value: string) {
  return value ? value.slice(0, 10) : "";
}

function formatDatetime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [form, setForm] = useState<CreateConsultationPayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const unauthorized = useMemo(() => error?.includes("401") || error?.includes("Token") || false, [error]);

  const loadConsultations = useCallback(async (activeFilters: Filters) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<ConsultationsResponse>("/api/consultations", {
        query: {
          patientId: activeFilters.patientId || undefined,
          medecinId: activeFilters.medecinId || undefined,
          rdvId: activeFilters.rdvId || undefined,
          from: toDateOnly(activeFilters.from) || undefined,
          to: toDateOnly(activeFilters.to) || undefined,
        },
      });

      setConsultations(data.items);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors du chargement des consultations");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConsultations(initialFilters);
  }, [loadConsultations]);

  async function handleCreateConsultation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch<ConsultationItem>("/api/consultations", {
        method: "POST",
        body: {
          rdvId: form.rdvId,
          patientId: form.patientId,
          medecinId: form.medecinId,
          motif: form.motif,
          symptomes: form.symptomes || undefined,
          diagnostic: form.diagnostic || undefined,
          traitement: form.traitement || undefined,
          tensionArterielle: form.tensionArterielle || undefined,
          poids: form.poids ? Number(form.poids) : undefined,
          temperature: form.temperature ? Number(form.temperature) : undefined,
          notes: form.notes || undefined,
        },
      });

      setForm(initialForm);
      await loadConsultations(filters);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors de la creation de la consultation");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConsultation(id: string) {
    setError(null);

    try {
      await apiFetch<void>(`/api/consultations/${id}`, { method: "DELETE" });
      await loadConsultations(filters);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors de la suppression de la consultation");
      }
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Consultations</h1>
        <p className="text-sm text-slate-600">Suivi medical des consultations et creation depuis les rendez-vous</p>
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
          <input
            placeholder="Rendez-vous ID"
            value={filters.rdvId}
            onChange={(event) => setFilters((prev) => ({ ...prev, rdvId: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
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
            onClick={() => void loadConsultations(filters)}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm text-white"
          >
            Rechercher
          </button>
          <button
            type="button"
            onClick={() => {
              setFilters(initialFilters);
              void loadConsultations(initialFilters);
            }}
            className="rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            Reinitialiser
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Nouvelle consultation</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateConsultation}>
          <input
            placeholder="Rendez-vous ID"
            value={form.rdvId}
            onChange={(event) => setForm((prev) => ({ ...prev, rdvId: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
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
            placeholder="Motif"
            value={form.motif}
            onChange={(event) => setForm((prev) => ({ ...prev, motif: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Tension arterielle"
            value={form.tensionArterielle}
            onChange={(event) => setForm((prev) => ({ ...prev, tensionArterielle: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.1"
              placeholder="Poids"
              value={form.poids}
              onChange={(event) => setForm((prev) => ({ ...prev, poids: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Temperature"
              value={form.temperature}
              onChange={(event) => setForm((prev) => ({ ...prev, temperature: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            placeholder="Symptomes"
            value={form.symptomes}
            onChange={(event) => setForm((prev) => ({ ...prev, symptomes: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={3}
          />
          <textarea
            placeholder="Diagnostic"
            value={form.diagnostic}
            onChange={(event) => setForm((prev) => ({ ...prev, diagnostic: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={3}
          />
          <textarea
            placeholder="Traitement"
            value={form.traitement}
            onChange={(event) => setForm((prev) => ({ ...prev, traitement: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={3}
          />
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
          >
            {submitting ? "Creation..." : "Ajouter consultation"}
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
              <th className="px-3 py-2">Diagnostic</th>
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
            ) : consultations.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={6}>
                  Aucune consultation trouvee
                </td>
              </tr>
            ) : (
              consultations.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{formatDatetime(item.createdAt)}</td>
                  <td className="px-3 py-2">{item.patient ? `${item.patient.prenom} ${item.patient.nom}` : item.patientId}</td>
                  <td className="px-3 py-2">{item.medecin ? `Dr ${item.medecin.prenom} ${item.medecin.nom}` : item.medecinId}</td>
                  <td className="px-3 py-2">{item.motif}</td>
                  <td className="px-3 py-2">{item.diagnostic || "-"}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void handleDeleteConsultation(item.id)}
                      className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
                    >
                      Supprimer
                    </button>
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
