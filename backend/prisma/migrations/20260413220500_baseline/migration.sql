-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEDECIN', 'SECRETAIRE');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "StatutRDV" AS ENUM ('PLANIFIE', 'CONFIRME', 'EN_COURS', 'TERMINE', 'ANNULE', 'ABSENT');

-- CreateTable
CREATE TABLE "compte" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "statut" "StatutCompte" NOT NULL DEFAULT 'ACTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medecin" (
    "id" TEXT NOT NULL,
    "compte_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "specialite" TEXT NOT NULL,
    "telephone" TEXT,
    "numero_ordre" TEXT,
    "formation" TEXT,
    "experience" TEXT,
    "disponibilites" JSONB,
    "statut" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medecin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel" (
    "id" TEXT NOT NULL,
    "compte_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "poste" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient" (
    "id" TEXT NOT NULL,
    "numero_dossier" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "date_naissance" TIMESTAMP(3) NOT NULL,
    "sexe" TEXT NOT NULL,
    "nni" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "groupe_sanguin" TEXT,
    "antecedents" TEXT,
    "allergies" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rendez_vous" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "medecin_id" TEXT NOT NULL,
    "date_heure" TIMESTAMP(3) NOT NULL,
    "duree" INTEGER NOT NULL DEFAULT 30,
    "motif" TEXT,
    "statut" "StatutRDV" NOT NULL DEFAULT 'PLANIFIE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rendez_vous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation" (
    "id" TEXT NOT NULL,
    "rdv_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "medecin_id" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "symptomes" TEXT,
    "diagnostic" TEXT,
    "traitement" TEXT,
    "tension_arterielle" TEXT,
    "poids" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription" (
    "id" TEXT NOT NULL,
    "consultation_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_item" (
    "id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "medicament_id" TEXT NOT NULL,
    "posologie" TEXT NOT NULL,
    "duree" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,

    CONSTRAINT "prescription_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicament" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "forme" TEXT,
    "dosage" TEXT,
    "stock_actuel" INTEGER NOT NULL DEFAULT 0,
    "seuil_alerte" INTEGER NOT NULL DEFAULT 10,
    "date_expiration" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvement_stock" (
    "id" TEXT NOT NULL,
    "medicament_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "motif" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvement_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_medical" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fichier_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dossier_medical_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "compte_email_key" ON "compte"("email");

-- CreateIndex
CREATE UNIQUE INDEX "medecin_compte_id_key" ON "medecin"("compte_id");

-- CreateIndex
CREATE UNIQUE INDEX "medecin_numero_ordre_key" ON "medecin"("numero_ordre");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_compte_id_key" ON "personnel"("compte_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_numero_dossier_key" ON "patient"("numero_dossier");

-- CreateIndex
CREATE UNIQUE INDEX "patient_nni_key" ON "patient"("nni");

-- CreateIndex
CREATE INDEX "rendez_vous_patient_id_idx" ON "rendez_vous"("patient_id");

-- CreateIndex
CREATE INDEX "rendez_vous_medecin_id_idx" ON "rendez_vous"("medecin_id");

-- CreateIndex
CREATE INDEX "rendez_vous_date_heure_idx" ON "rendez_vous"("date_heure");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_rdv_id_key" ON "consultation"("rdv_id");

-- CreateIndex
CREATE INDEX "consultation_patient_id_idx" ON "consultation"("patient_id");

-- CreateIndex
CREATE INDEX "consultation_medecin_id_idx" ON "consultation"("medecin_id");

-- CreateIndex
CREATE INDEX "prescription_consultation_id_idx" ON "prescription"("consultation_id");

-- CreateIndex
CREATE INDEX "prescription_item_prescription_id_idx" ON "prescription_item"("prescription_id");

-- CreateIndex
CREATE INDEX "mouvement_stock_medicament_id_idx" ON "mouvement_stock"("medicament_id");

-- CreateIndex
CREATE INDEX "dossier_medical_patient_id_idx" ON "dossier_medical"("patient_id");

-- AddForeignKey
ALTER TABLE "medecin" ADD CONSTRAINT "medecin_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "compte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "compte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_medecin_id_fkey" FOREIGN KEY ("medecin_id") REFERENCES "medecin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation" ADD CONSTRAINT "consultation_rdv_id_fkey" FOREIGN KEY ("rdv_id") REFERENCES "rendez_vous"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation" ADD CONSTRAINT "consultation_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation" ADD CONSTRAINT "consultation_medecin_id_fkey" FOREIGN KEY ("medecin_id") REFERENCES "medecin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_item" ADD CONSTRAINT "prescription_item_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_item" ADD CONSTRAINT "prescription_item_medicament_id_fkey" FOREIGN KEY ("medicament_id") REFERENCES "medicament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvement_stock" ADD CONSTRAINT "mouvement_stock_medicament_id_fkey" FOREIGN KEY ("medicament_id") REFERENCES "medicament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_medical" ADD CONSTRAINT "dossier_medical_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

