import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import adminUsersRoutes from "./modules/admin-users/adminUsers.routes";
import authRoutes from "./modules/auth/auth.routes";
import cabinetSettingsRoutes from "./modules/cabinet-settings/cabinetSettings.routes";
import consultationsRoutes from "./modules/consultations/consultations.routes";
import dossiersMedicauxRoutes from "./modules/dossiers-medicaux/dossiersMedicaux.routes";
import medecinsRoutes from "./modules/medecins/medecins.routes";
import patientsRoutes from "./modules/patients/patients.routes";
import prescriptionsRoutes from "./modules/prescriptions/prescriptions.routes";
import rapportsRoutes from "./modules/rapports-statistiques/rapportsStatistiques.routes";
import rendezVousRoutes from "./modules/rendezvous/rendezvous.routes";

const app = express();

// ── Sécurité ──────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true },
    frameguard: { action: "deny" },
    noSniff: true,
  })
);

app.use(
  cors({
    origin: env.NODE_ENV === "production" ? env.FRONTEND_URL : "*",
    credentials: true,
  })
);

// ── Body parser ───────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cabinet-settings", cabinetSettingsRoutes);
app.use("/api/consultations", consultationsRoutes);
app.use("/api/dossiers-medicaux", dossiersMedicauxRoutes);
app.use("/api/medecins", medecinsRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/prescriptions", prescriptionsRoutes);
app.use("/api/rapports", rapportsRoutes);
app.use("/api/rendezvous", rendezVousRoutes);

// ── Error handler (toujours en dernier) ───────────────────
app.use(errorHandler);

export default app;
