import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch } from "../lib/api";

interface Medecin {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
  telephone?: string;
  numeroOrdre?: string;
  statut: boolean;
}

interface MedecinsResponse {
  items: Medecin[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CreateMedecinPayload {
  compteId: string;
  nom: string;
  prenom: string;
  specialite: string;
  telephone?: string;
  numeroOrdre?: string;
}

const initialForm: CreateMedecinPayload = {
  compteId: "",
  nom: "",
  prenom: "",
  specialite: "",
  telephone: "",
  numeroOrdre: "",
};

export default function MedecinsPage() {
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<CreateMedecinPayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const unauthorized = useMemo(() => error?.includes("401") || error?.includes("Token") || false, [error]);

  const loadMedecins = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<MedecinsResponse>("/api/medecins", {
        query: {
          q: searchQuery || undefined,
        },
      });
      setMedecins(data.items);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors du chargement des medecins");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMedecins("");
  }, [loadMedecins]);

  async function handleCreateMedecin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch<Medecin>("/api/medecins", {
        method: "POST",
        body: {
          ...form,
          telephone: form.telephone || undefined,
          numeroOrdre: form.numeroOrdre || undefined,
        },
      });

      setForm(initialForm);
      await loadMedecins(query);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors de la creation du medecin");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivateMedecin(id: string) {
    setError(null);

    try {
      await apiFetch<void>(`/api/medecins/${id}`, { method: "DELETE" });
      await loadMedecins(query);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.status} - ${err.message}`);
      } else {
        setError("Erreur inconnue lors de la desactivation du medecin");
      }
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medecins</h1>
          <p className="text-sm text-slate-600">Liste et creation des medecins</p>
        </div>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher (nom, prenom, specialite...)"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void loadMedecins(query)}
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
        <h2 className="mb-3 font-semibold text-slate-900">Nouveau medecin</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateMedecin}>
          <input
            placeholder="ID compte (role MEDECIN)"
            value={form.compteId}
            onChange={(event) => setForm((prev) => ({ ...prev, compteId: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            required
          />
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
            placeholder="Specialite"
            value={form.specialite}
            onChange={(event) => setForm((prev) => ({ ...prev, specialite: event.target.value }))}
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
            placeholder="Numero ordre"
            value={form.numeroOrdre}
            onChange={(event) => setForm((prev) => ({ ...prev, numeroOrdre: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
          >
            {submitting ? "Creation..." : "Ajouter medecin"}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Nom complet</th>
              <th className="px-3 py-2">Specialite</th>
              <th className="px-3 py-2">Numero ordre</th>
              <th className="px-3 py-2">Statut</th>
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
            ) : medecins.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={5}>
                  Aucun medecin trouve
                </td>
              </tr>
            ) : (
              medecins.map((medecin) => (
                <tr key={medecin.id}>
                  <td className="px-3 py-2">{medecin.prenom} {medecin.nom}</td>
                  <td className="px-3 py-2">{medecin.specialite}</td>
                  <td className="px-3 py-2">{medecin.numeroOrdre || "-"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${medecin.statut ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                      {medecin.statut ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void handleDeactivateMedecin(medecin.id)}
                      className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
                    >
                      Desactiver
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
