// apps/web/scripts/setup-views.cjs
const { Client } = require("pg");

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`CREATE SCHEMA IF NOT EXISTS public_api;`);

  await client.query(`
    CREATE OR REPLACE VIEW public_api.v_pilots AS
    SELECT id, ref, title, status, mission, "summaryPublic", "startDate", "endDate",
           "totalBudget", "exportPotential", "publishedAt"
    FROM "Pilot"
    WHERE "visibilityPublic" = true AND "publishedAt" IS NOT NULL;
  `);

  await client.query(`
    CREATE OR REPLACE VIEW public_api.v_sites AS
    SELECT s.id, s."pilotId", s.name, s.town, s.region, s.lat, s.lng
    FROM "Site" s
    JOIN "Pilot" p ON p.id = s."pilotId"
    WHERE p."visibilityPublic" = true AND p."publishedAt" IS NOT NULL;
  `);

  await client.query(`
    CREATE OR REPLACE VIEW public_api.v_kpis AS
    SELECT k.id, k."pilotId", k.name, k.target
    FROM "KPI" k
    JOIN "Pilot" p ON p.id = k."pilotId"
    WHERE p."visibilityPublic" = true AND p."publishedAt" IS NOT NULL AND k."publicHeadline" = true;
  `);

  await client.query(`
    CREATE OR REPLACE VIEW public_api.v_outcomes AS
    SELECT o.id, o."pilotId", o."achieved", o."kpiId"
    FROM "KPIOutcome" o
    JOIN "Pilot" p ON p.id = o."pilotId"
    WHERE p."visibilityPublic" = true AND p."publishedAt" IS NOT NULL;
  `);

  await client.query(`
    CREATE OR REPLACE VIEW public_api.v_docs AS
    SELECT d.id, d."pilotId", d.label, d.url
    FROM "DocLink" d
    JOIN "Pilot" p ON p.id = d."pilotId"
    WHERE p."visibilityPublic" = true AND p."publishedAt" IS NOT NULL AND d.public = true;
  `);

  await client.query(`GRANT USAGE ON SCHEMA public_api TO opl_public_reader;`);
  await client.query(`GRANT SELECT ON ALL TABLES IN SCHEMA public_api TO opl_public_reader;`);

  await client.end();
  console.log("public_api views ensured");
})().catch((e) => {
  console.error("setup-views error:", e);
  process.exit(1);
});
