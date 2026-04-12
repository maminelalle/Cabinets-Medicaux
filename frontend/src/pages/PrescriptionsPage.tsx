import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch } from "../lib/api";

interface PrescriptionItem {
  id: string;
  consultationId: string;
  notes?: string;
  createdAt: string;
  consultation?: {
    id: string;
    patientId: string;
    medecinId: string;
    motif: string;
  };
  items: Array<{
    id: string;
    medicamentId: string;
    posologie: string;
    duree: string;
    quantite: number;
    medicament?: {
      id: string;
      nom: string;
      forme?: string;
      dosage?: string;
    };
  }>;
}

interface PrescriptionsResponse {
  items: PrescriptionItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FormItem {
  medicamentId: string;
  posologie: string;
  duree: string;
  quantite: string;
}

interface CreatePrescriptionPayload {
  consultationId: string;
  notes: string;
  items: FormItem[];
}

interface Filters {
  consultationId: string;
  patientId: string;
  medecinId: string;
}

const emptyItem: FormItem = {
  medicamentId: "",
  posologie: "",
  duree: "",
  quantite: "1",
};

const initialForm: CreatePrescriptionPayload = {
  consultationId: "",
  notes: "",
  items: [{ ...emptyItem }],
};

const initialFilters: Filters = {
  consultationId: "",
  patientId: "",
  medecinId: "",
};

function formatDatetime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [form, setForm] = useState<CreatePrescriptionPayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const unauthorized = useMemo(() => error?.includes("401") || error?.includes("Token") || false, [error]);

  const loadPrescriptions = useCallback(async (activeFilters: Filters) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<PrescriptionsResponse>("/api/prescriptions", {
        query: {
          consultationId: activeFilters.consultationId || undefined,
          patientId: activeFilters.patientId || undefined,
          medecinId: activeFilters.medecinId || undefined,
        },
      });
      setPrescriptions(data.items);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors du chargement des prescriptions");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrescriptions(initialFilters);
  }, [loadPrescriptions]);

  function updateFormItem(index: number, updates: Partial<FormItem>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...updates } : item)),
    }));
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }],
    }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleCreatePrescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch<PrescriptionItem>("/api/prescriptions", {
        method: "POST",
        body: {
          consultationId: form.consultationId,
          notes: form.notes || undefined,
          items: form.items.map((item) => ({
            medicamentId: item.medicamentId,
            posologie: item.posologie,
            duree: item.duree,
            quantite: Number(item.quantite),
          })),
        },
      });

      setForm(initialForm);
      await loadPrescriptions(filters);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors de la creation de la prescription");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePrescription(id: string) {
    setError(null);

    try {
      await apiFetch<void>(`/api/prescriptions/${id}`, { method: "DELETE" });
      await loadPrescriptions(filters);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors de la suppression de la prescription");
      }
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
        <p className="text-sm text-slate-600">Creation des ordonnances et suivi des lignes medicamenteuses</p>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          {unauthorized ? " - Connecte-toi avec un vrai token backend pour acceder aux endpoints securises." : ""}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Filtres</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            placeholder="Consultation ID"
            value={filters.consultationId}
            onChange={(event) => setFilters((prev) => ({ ...prev, consultationId: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
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
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void loadPrescriptions(filters)}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm text-white"
          >
            Rechercher
          </button>
          <button
            type="button"
            onClick={() => {
              setFilters(initialFilters);
              void loadPrescriptions(initialFilters);
            }}
            className="rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            Reinitialiser
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Nouvelle prescription</h2>
        <form className="space-y-3" onSubmit={handleCreatePrescription}>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              placeholder="Consultation ID"
              value={form.consultationId}
              onChange={(event) => setForm((prev) => ({ ...prev, consultationId: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Notes"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            {form.items.map((item, index) => (
              <div key={`${index}-${item.medicamentId}`} className="grid gap-2 rounded-md border border-slate-200 p-3 md:grid-cols-4">
                <input
                  placeholder="Medicament ID"
                  value={item.medicamentId}
                  onChange={(event) => updateFormItem(index, { medicamentId: event.target.value })}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
                <input
                  placeholder="Posologie"
                  value={item.posologie}
                  onChange={(event) => updateFormItem(index, { posologie: event.target.value })}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
                <input
                  placeholder="Duree"
                  value={item.duree}
                  onChange={(event) => updateFormItem(index, { duree: event.target.value })}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantite}
                    onChange={(event) => updateFormItem(index, { quantite: event.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={form.items.length <= 1}
                    className="rounded-md bg-slate-200 px-3 py-2 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addItem}
              className="rounded-md bg-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              Ajouter une ligne
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creation..." : "Creer prescription"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Consultation</th>
              <th className="px-3 py-2">Motif</th>
              <th className="px-3 py-2">Lignes</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={5}>
                  Chargement...
                </td>
              </tr>
            ) : prescriptions.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={5}>
                  Aucune prescription trouvee
                </td>
              </tr>
            ) : (
              prescriptions.map((prescription) => (
                <tr key={prescription.id}>
                  <td className="px-3 py-2">{formatDatetime(prescription.createdAt)}</td>
                  <td className="px-3 py-2">{prescription.consultationId}</td>
                  <td className="px-3 py-2">{prescription.consultation?.motif || "-"}</td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      {prescription.items.map((item) => (
                        <div key={item.id} className="text-xs text-slate-700">
                          {(item.medicament?.nom || item.medicamentId)} - {item.posologie} - {item.duree} - qte {item.quantite}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void handleDeletePrescription(prescription.id)}
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
