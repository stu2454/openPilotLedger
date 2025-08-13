-- CreateEnum
CREATE TYPE "PilotStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "Mission" AS ENUM ('CLIMATE_POSITIVE', 'CARE_AT_EDGE', 'SOVEREIGN_AGRI', 'RESILIENT_TOWNS');

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pilot" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "PilotStatus" NOT NULL DEFAULT 'PLANNED',
    "mission" "Mission" NOT NULL,
    "problemOwnerId" TEXT NOT NULL,
    "guildLead" TEXT NOT NULL,
    "summaryPublic" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalBudget" INTEGER,
    "exportPotential" BOOLEAN NOT NULL DEFAULT false,
    "dataGovernanceNotes" TEXT,
    "commercialNotes" TEXT,
    "nextSteps" TEXT,
    "visibilityPublic" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pilot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "region" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPI" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicHeadline" BOOLEAN NOT NULL DEFAULT true,
    "definition" TEXT,
    "baseline" TEXT,
    "target" TEXT,

    CONSTRAINT "KPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPIOutcome" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "kpiId" TEXT,
    "achieved" TEXT,

    CONSTRAINT "KPIOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funding" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amountAud" INTEGER,
    "confidential" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Funding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "decisionType" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "decidedBy" TEXT[],
    "links" TEXT[],

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocLink" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DocLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditTrail" (
    "id" TEXT NOT NULL,
    "pilotId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "diff" JSONB NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditTrail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_name_key" ON "Organisation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_abn_key" ON "Organisation"("abn");

-- CreateIndex
CREATE UNIQUE INDEX "Pilot_ref_key" ON "Pilot"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "KPI_pilotId_name_key" ON "KPI"("pilotId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "KPIOutcome_kpiId_key" ON "KPIOutcome"("kpiId");

-- CreateIndex
CREATE UNIQUE INDEX "Funding_pilotId_source_key" ON "Funding"("pilotId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "DocLink_pilotId_label_key" ON "DocLink"("pilotId", "label");

-- AddForeignKey
ALTER TABLE "Pilot" ADD CONSTRAINT "Pilot_problemOwnerId_fkey" FOREIGN KEY ("problemOwnerId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPI" ADD CONSTRAINT "KPI_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPIOutcome" ADD CONSTRAINT "KPIOutcome_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPIOutcome" ADD CONSTRAINT "KPIOutcome_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "KPI"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funding" ADD CONSTRAINT "Funding_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocLink" ADD CONSTRAINT "DocLink_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrail" ADD CONSTRAINT "AuditTrail_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
