import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import consultationsRoutes from "./modules/consultations/consultations.routes";
import medecinsRoutes from "./modules/medecins/medecins.routes";
import patientsRoutes from "./modules/patients/patients.routes";
import prescriptionsRoutes from "./modules/prescriptions/prescriptions.routes";
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

app.use("/api/auth", authRoutes);
app.use("/api/consultations", consultationsRoutes);
app.use("/api/medecins", medecinsRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/prescriptions", prescriptionsRoutes);
app.use("/api/rendezvous", rendezVousRoutes);

// ── Error handler (toujours en dernier) ───────────────────
app.use(errorHandler);

export default app;
