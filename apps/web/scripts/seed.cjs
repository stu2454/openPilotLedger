// apps/web/scripts/seed.cjs
// Idempotent seed for demo data (11 pilots) with uniqueness to avoid duplicates.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ORGS = [
  { name: "Northern Tablelands Beef Co-op", abn: "12 345 678 901" },
  { name: "UNE Smart Region Incubator", abn: "12 345 678 902" },
  { name: "Hunter New England Health", abn: "12 345 678 903" },
  { name: "NSW Department of Primary Industries", abn: "12 345 678 904" },
  { name: "ArmTech Manufacturing", abn: "12 345 678 905" },
  { name: "Riverlands Aged Care", abn: "12 345 678 906" },
  { name: "Mid-North Coast Council", abn: "12 345 678 907" },
];

const PILOTS = [
  // Existing exemplar
  {
    ref: "CLIM-2025-001",
    title: "AI-Enabled Pasture Management for Drought Resilience",
    mission: "CLIMATE_POSITIVE",
    status: "COMPLETED",
    problemOwnerAbn: "12 345 678 901",
    guildLead: "AgriTech Solutions Pty Ltd",
    summaryPublic:
      "16-week pilot deploying AI pasture sensors across 8 farms to optimise irrigation and grazing for water efficiency and yield.",
    startDate: "2025-02-12",
    endDate: "2025-05-31",
    totalBudget: 150000,
    exportPotential: true,
    published: true,
    sites: ["Guyra", "Inverell", "Walcha"],
    kpis: [
      ["Pasture yield prediction accuracy", "+15%", "+14%"],
      ["Water-use efficiency", "+10%", "+11%"],
    ],
  },

  // Climate Positive (in-progress)
  {
    ref: "CLIM-2025-002",
    title: "Low‑Emissions Cold Chain for Regional Meat Exports",
    mission: "CLIMATE_POSITIVE",
    status: "IN_PROGRESS",
    problemOwnerAbn: "12 345 678 905",
    guildLead: "CoolFlow Engineering",
    summaryPublic:
      "Electrified refrigeration with route optimisation across 3 regional depots to cut diesel use and spoilage.",
    startDate: "2025-06-10",
    endDate: null,
    totalBudget: 220000,
    exportPotential: true,
    published: true,
    sites: ["Tamworth", "Armidale", "Gunnedah"],
    kpis: [
      ["Fuel consumption reduction", "-18%", "-12%"],
      ["Spoilage rate reduction", "-30%", "-22%"],
    ],
  },

  // Care at Edge (completed)
  {
    ref: "CARE-2025-003",
    title: "In‑Home Telehealth Cart for Rural Aged Care",
    mission: "CARE_AT_EDGE",
    status: "COMPLETED",
    problemOwnerAbn: "12 345 678 906",
    guildLead: "Bondi Labs Health",
    summaryPublic:
      "Deployable telehealth carts connecting residents to specialists; includes digital stethoscope and vitals.",
    startDate: "2025-03-01",
    endDate: "2025-06-20",
    totalBudget: 120000,
    exportPotential: false,
    published: true,
    sites: ["Armidale", "Uralla"],
    kpis: [
      ["Transfer-to-hospital reduction", "-20%", "-18%"],
      ["Telehealth adoption rate", "70%", "65%"],
    ],
  },

  // Care at Edge (planned, unpublished)
  {
    ref: "CARE-2025-004",
    title: "Falls‑Risk Computer Vision in Community Housing",
    mission: "CARE_AT_EDGE",
    status: "PLANNED",
    problemOwnerAbn: "12 345 678 906",
    guildLead: "VisionSafe Analytics",
    summaryPublic:
      "Edge cameras + privacy‑preserving models to alert carers to high‑risk gait or environmental hazards.",
    startDate: "2025-09-15",
    endDate: null,
    totalBudget: 90000,
    exportPotential: true,
    published: false,
    sites: ["Armidale"],
    kpis: [["Fall incidents reduction", "-25%", null]],
  },

  // Sovereign Agri (in-progress)
  {
    ref: "SOV-2025-005",
    title: "On‑Farm Spectroscopy for Grain Quality Assurance",
    mission: "SOVEREIGN_AGRI",
    status: "IN_PROGRESS",
    problemOwnerAbn: "12 345 678 904",
    guildLead: "SpectraFarm Pty Ltd",
    summaryPublic:
      "Handheld NIR spectroscopy for protein/moisture grading pre‑silo to improve price realisation.",
    startDate: "2025-05-01",
    endDate: null,
    totalBudget: 180000,
    exportPotential: true,
    published: true,
    sites: ["Moree", "Narrabri"],
    kpis: [
      ["Protein measurement error", "≤0.5%", "0.6%"],
      ["Price uplift vs baseline", "+4%", "+3%"],
    ],
  },

  // Sovereign Agri (terminated)
  {
    ref: "SOV-2025-006",
    title: "Blockchain Cattle Provenance Trial",
    mission: "SOVEREIGN_AGRI",
    status: "TERMINATED",
    problemOwnerAbn: "12 345 678 901",
    guildLead: "ChainTrace Ltd",
    summaryPublic:
      "Ledger‑based traceback for cattle lots; terminated due to device failure rate and onboarding friction.",
    startDate: "2025-01-15",
    endDate: "2025-03-10",
    totalBudget: 80000,
    exportPotential: false,
    published: true,
    sites: ["Glen Innes"],
    kpis: [["Onboarding time per lot", "-40%", "-5%"]],
  },

  // Resilient Towns (in-progress)
  {
    ref: "RES-2025-007",
    title: "Community Microgrid with Peer‑to‑Peer Trading",
    mission: "RESILIENT_TOWNS",
    status: "IN_PROGRESS",
    problemOwnerAbn: "12 345 678 907",
    guildLead: "GridFlex Energy",
    summaryPublic:
      "Solar + battery microgrid with local energy trading to improve outage resilience in storm events.",
    startDate: "2025-04-10",
    endDate: null,
    totalBudget: 450000,
    exportPotential: true,
    published: true,
    sites: ["Dorrigo"],
    kpis: [
      ["Outage minutes reduced", "-50%", "-28%"],
      ["Local generation share", "60%", "43%"],
    ],
  },

  // Resilient Towns (planned, unpublished)
  {
    ref: "RES-2025-008",
    title: "Flood Early‑Warning Sensors for Bridge Approaches",
    mission: "RESILIENT_TOWNS",
    status: "PLANNED",
    problemOwnerAbn: "12 345 678 907",
    guildLead: "HydroSense Pty Ltd",
    summaryPublic:
      "Ultrasonic level sensors with LoRaWAN and SMS alerts to vehicles approaching low‑lying crossings.",
    startDate: "2025-10-01",
    endDate: null,
    totalBudget: 130000,
    exportPotential: true,
    published: false,
    sites: ["Bellingen", "Thora"],
    kpis: [["Unplanned closures reduced", "-30%", null]],
  },

  // Care at Edge (in-progress)
  {
    ref: "CARE-2025-009",
    title: "Remote Cognitive Rehab Using Mixed Reality",
    mission: "CARE_AT_EDGE",
    status: "IN_PROGRESS",
    problemOwnerAbn: "12 345 678 906",
    guildLead: "NeuroXR Labs",
    summaryPublic:
      "Mixed‑reality exercises supervised remotely to improve adherence and reduce travel burden.",
    startDate: "2025-06-25",
    endDate: null,
    totalBudget: 160000,
    exportPotential: false,
    published: true,
    sites: ["Armidale", "Tamworth"],
    kpis: [
      ["Session adherence", "≥75%", "68%"],
      ["Reported anxiety score (GAD‑7)", "-20%", "-12%"],
    ],
  },

  // Sovereign Agri (in-progress)
  {
    ref: "SOV-2025-010",
    title: "Edge‑AI Weed Detection for Broadacre Spraying",
    mission: "SOVEREIGN_AGRI",
    status: "IN_PROGRESS",
    problemOwnerAbn: "12 345 678 904",
    guildLead: "GreenSight Robotics",
    summaryPublic:
      "Camera booms with on‑device models to reduce chemical use and drift, with agronomic dashboard.",
    startDate: "2025-07-05",
    endDate: null,
    totalBudget: 300000,
    exportPotential: true,
    published: true,
    sites: ["Moree"],
    kpis: [
      ["Herbicide volume reduction", "-40%", "-24%"],
      ["Detection precision", "≥0.9", "0.86"],
    ],
  },

  // Climate Positive (planned, unpublished)
  {
    ref: "CLIM-2025-011",
    title: "Circular Packaging for Regional Food SMEs",
    mission: "CLIMATE_POSITIVE",
    status: "PLANNED",
    problemOwnerAbn: "12 345 678 902",
    guildLead: "LoopPack Cooperative",
    summaryPublic:
      "Reusable containers with deposit‑return at farmers’ markets; cleaning hub feasibility.",
    startDate: "2025-09-20",
    endDate: null,
    totalBudget: 60000,
    exportPotential: true,
    published: false,
    sites: ["Armidale"],
    kpis: [["Single‑use packaging avoided", "50k units", null]],
  },
];

// ---------- helpers ----------

async function upsertOrg({ name, abn }) {
  // name is unique in schema (also abn unique if present)
  const where = abn ? { abn } : { name };
  return prisma.organisation.upsert({
    where,
    update: { name, abn },
    create: { name, abn },
  });
}

async function seedPilot(p) {
  const owner = ORGS.find((o) => o.abn === p.problemOwnerAbn) || ORGS[0];
  const org = await upsertOrg(owner);

  const pilot = await prisma.pilot.upsert({
    where: { ref: p.ref },
    update: {
      title: p.title,
      status: p.status,
      mission: p.mission,
      guildLead: p.guildLead,
      summaryPublic: p.summaryPublic,
      startDate: p.startDate ? new Date(p.startDate) : null,
      endDate: p.endDate ? new Date(p.endDate) : null,
      totalBudget: p.totalBudget ?? null,
      exportPotential: !!p.exportPotential,
      visibilityPublic: !!p.published,
      publishedAt: p.published ? new Date() : null,
      nextSteps:
        p.status === "COMPLETED"
          ? "Replication and scale planning underway."
          : "Continue pilot; prepare monthly update.",
      problemOwnerId: org.id,
    },
    create: {
      ref: p.ref,
      title: p.title,
      status: p.status,
      mission: p.mission,
      problemOwnerId: org.id,
      guildLead: p.guildLead,
      summaryPublic: p.summaryPublic,
      startDate: p.startDate ? new Date(p.startDate) : null,
      endDate: p.endDate ? new Date(p.endDate) : null,
      totalBudget: p.totalBudget ?? null,
      exportPotential: !!p.exportPotential,
      visibilityPublic: !!p.published,
      publishedAt: p.published ? new Date() : null,
      nextSteps:
        p.status === "COMPLETED"
          ? "Replication and scale planning underway."
          : "Continue pilot; prepare monthly update.",
    },
  });

  // Sites (idempotent via deterministic id)
  for (const town of p.sites || []) {
    const sid = `${pilot.id}:${town}`;
    await prisma.site.upsert({
      where: { id: sid },
      update: { name: `${town} site`, town, region: "Northern Tablelands" },
      create: {
        id: sid,
        pilotId: pilot.id,
        name: `${town} site`,
        town,
        region: "Northern Tablelands",
      },
    });
  }

  // KPIs & Outcomes (idempotent via unique constraints)
  for (const [name, target, achieved] of p.kpis || []) {
    const k = await prisma.kPI.upsert({
      where: { pilotId_name: { pilotId: pilot.id, name } },
      update: { target },
      create: { pilotId: pilot.id, name, target, publicHeadline: true },
    });
    if (achieved != null) {
      await prisma.kPIOutcome.upsert({
        where: { kpiId: k.id },
        update: { achieved },
        create: { pilotId: pilot.id, kpiId: k.id, achieved },
      });
    }
  }

  // Funding (idempotent)
  if (p.totalBudget) {
    const third = Math.floor(p.totalBudget / 3);
    await prisma.funding.createMany({
      data: [
        { pilotId: pilot.id, source: "Lead organisation", amountAud: third },
        { pilotId: pilot.id, source: "State grant", amountAud: third },
        { pilotId: pilot.id, source: "Industry partner", amountAud: p.totalBudget - third * 2 },
      ],
      skipDuplicates: true,
    });
  }

  // Docs (idempotent)
  await prisma.docLink.upsert({
    where: { pilotId_label: { pilotId: pilot.id, label: "Pilot One‑Pager" } },
    update: { url: "https://example.org/one-pager.pdf", public: true },
    create: {
      pilotId: pilot.id,
      label: "Pilot One‑Pager",
      url: "https://example.org/one-pager.pdf",
      public: true,
    },
  });

  // Log (single “init” log; idempotent via deterministic id)
  const logId = `${pilot.id}:init`;
  await prisma.logEntry.upsert({
    where: { id: logId },
    update: {
      author: p.guildLead,
      kind: "update",
      body:
        p.status === "COMPLETED"
          ? "Final report submitted and KPIs recorded."
          : "Kickoff complete; hardware ordered; first site configured.",
    },
    create: {
      id: logId,
      pilotId: pilot.id,
      author: p.guildLead,
      kind: "update",
      body:
        p.status === "COMPLETED"
          ? "Final report submitted and KPIs recorded."
          : "Kickoff complete; hardware ordered; first site configured.",
    },
  });

  return pilot;
}

// ---------- run ----------
(async () => {
  await Promise.all(ORGS.map(upsertOrg));
  for (const p of PILOTS) {
    await seedPilot(p);
  }
  console.log("Seed complete");
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
