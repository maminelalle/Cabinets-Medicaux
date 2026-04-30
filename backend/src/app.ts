import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config/swagger";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import consultationRoutes from "./modules/consultations/consultation.routes";
import patientsRoutes from "./modules/patients/patients.routes";
import prescriptionRoutes from "./modules/prescriptions/prescription.routes";
import rendezvousRoutes from "./modules/rendezvous/rendezvous.routes";
import stockRoutes from "./modules/stock/stock.routes";



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

// ── Documentation Swagger ────────────────────────────
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Cabinets Médicaux – API Docs",
    customCss: `.swagger-ui .topbar { background-color: #1a1a2e; } .swagger-ui .topbar-wrapper img { content: none; } .swagger-ui .topbar-wrapper::before { content: '🏥 Cabinets Médicaux'; color: white; font-size: 1.2rem; font-weight: bold; }`,
    swaggerOptions: { persistAuthorization: true },
  })
);

// Expose la spec JSON brute
app.get("/api/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ── Routes ────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/readiness", async (_req, res) => {
  const readiness: {
    status: string;
    timestamp: string;
    checks: {
      database: string;
      redis: string;
    };
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    checks: {
      database: "unknown",
      redis: "unknown",
    },
  };

  try {
    const { prisma } = await import("./prisma/client");
    await prisma.$queryRaw`SELECT 1`;
    readiness.checks.database = "up";
  } catch (error) {
    readiness.status = "error";
    readiness.checks.database = `down: ${error instanceof Error ? error.message : "unknown error"}`;
  }

  try {
    const { redis } = await import("./config/redis");
    if (redis && (redis.isOpen || redis.isReady)) {
      readiness.checks.redis = "up";
    } else {
      readiness.checks.redis = "down (fallback memoire actif)";
    }
  } catch {
    readiness.checks.redis = "down (fallback memoire actif)";
  }


  const statusCode = readiness.status === "ok" ? 200 : 503;
  res.status(statusCode).json(readiness);
});


app.use("/api/auth", authRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/rendezvous", rendezvousRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/stock", stockRoutes);




// ── Error handler (toujours en dernier) ───────────────────
app.use(errorHandler);

export default app;
