import { redis } from "../../config/redis";

const CABINET_SETTINGS_KEY = "cabinet:settings";

export interface CabinetSettings {
  nomCabinet: string;
  adresse: string;
  telephone: string;
  email: string;
  horaires: Record<string, string[]>;
  fuseauHoraire: string;
  langue: string;
  devise: string;
}

const defaultCabinetSettings: CabinetSettings = {
  nomCabinet: "Cabinet Médical",
  adresse: "",
  telephone: "",
  email: "",
  horaires: {
    lundi: ["08:00-12:00", "14:00-18:00"],
    mardi: ["08:00-12:00", "14:00-18:00"],
    mercredi: ["08:00-12:00", "14:00-18:00"],
    jeudi: ["08:00-12:00", "14:00-18:00"],
    vendredi: ["08:00-12:00", "14:00-18:00"],
  },
  fuseauHoraire: "Africa/Nouakchott",
  langue: "fr",
  devise: "MRU",
};

function parseSettings(raw: string | null): CabinetSettings {
  if (!raw) {
    return defaultCabinetSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CabinetSettings>;
    return {
      ...defaultCabinetSettings,
      ...parsed,
      horaires: {
        ...defaultCabinetSettings.horaires,
        ...(parsed.horaires ?? {}),
      },
    };
  } catch {
    return defaultCabinetSettings;
  }
}

export async function getCabinetSettings() {
  const raw = await redis.get(CABINET_SETTINGS_KEY);
  return parseSettings(raw);
}

export async function updateCabinetSettings(nextSettings: Partial<CabinetSettings>) {
  const current = await getCabinetSettings();
  const merged: CabinetSettings = {
    ...current,
    ...nextSettings,
    horaires: {
      ...current.horaires,
      ...(nextSettings.horaires ?? {}),
    },
  };

  await redis.set(CABINET_SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}
