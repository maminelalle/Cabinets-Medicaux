import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch } from "../lib/api";

interface Patient {
  id: string;
  numeroDossier: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string;
  nni: string;
  telephone?: string;
  email?: string;
}

interface PatientsResponse {
  items: Patient[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CreatePatientPayload {
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string;
  nni: string;
  telephone?: string;
  email?: string;
}

const initialForm: CreatePatientPayload = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  sexe: "",
  nni: "",
  telephone: "",
  email: "",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<CreatePatientPayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const unauthorized = useMemo(() => error?.includes("401") || error?.includes("Token") || false, [error]);

  const loadPatients = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<PatientsResponse>("/api/patients", {
        query: {
          q: searchQuery || undefined,
        },
      });
      setPatients(data.items);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors du chargement des patients");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPatients("");
  }, [loadPatients]);

  async function handleCreatePatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch<Patient>("/api/patients", {
        method: "POST",
        body: {
          ...form,
          telephone: form.telephone || undefined,
          email: form.email || undefined,
        },
      });

      setForm(initialForm);
      await loadPatients(query);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors de la creation du patient");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePatient(id: string) {
    setError(null);

    try {
      await apiFetch<void>(`/api/patients/${id}`, { method: "DELETE" });
      await loadPatients(query);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors de la suppression du patient");
      }
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-600">Liste et creation des patients</p>
        </div>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher (nom, prenom, NNI...)"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void loadPatients(query)}
            className="rounded-md bg-blue-700 px-3 py-2 text-sm text-white"
          >
            Rechercher
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          {unauthorized ? " - Connecte-toi avec un vrai token backend pour acceder aux endpoints securises." : ""}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Nouveau patient</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreatePatient}>
          <input
            placeholder="Nom"
            value={form.nom}
            onChange={(event) => setForm((prev) => ({ ...prev, nom: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Prenom"
            value={form.prenom}
            onChange={(event) => setForm((prev) => ({ ...prev, prenom: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="date"
            value={form.dateNaissance}
            onChange={(event) => setForm((prev) => ({ ...prev, dateNaissance: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Sexe"
            value={form.sexe}
            onChange={(event) => setForm((prev) => ({ ...prev, sexe: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="NNI"
            value={form.nni}
            onChange={(event) => setForm((prev) => ({ ...prev, nni: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Telephone"
            value={form.telephone}
            onChange={(event) => setForm((prev) => ({ ...prev, telephone: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
          >
            {submitting ? "Creation..." : "Ajouter patient"}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Dossier</th>
              <th className="px-3 py-2">Nom complet</th>
              <th className="px-3 py-2">NNI</th>
              <th className="px-3 py-2">Sexe</th>
              <th className="px-3 py-2">Contact</th>
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
            ) : patients.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={6}>
                  Aucun patient trouve
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-3 py-2 font-mono text-xs">{patient.numeroDossier}</td>
                  <td className="px-3 py-2">{patient.prenom} {patient.nom}</td>
                  <td className="px-3 py-2">{patient.nni}</td>
                  <td className="px-3 py-2">{patient.sexe}</td>
                  <td className="px-3 py-2">{patient.telephone || patient.email || "-"}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void handleDeletePatient(patient.id)}
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
