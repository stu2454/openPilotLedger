import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const pilots = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_pilots ORDER BY "publishedAt" DESC`);
  const sites  = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_sites`);
  const kpis   = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_kpis`);
  const outs   = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_outcomes`);
  const docs   = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_docs`);

  const byPilot: Record<string, any> = Object.fromEntries(
    pilots.map(p => [p.id, { ...p, sites: [], kpis: [], outcomes: [], docs: [] }])
  );

  for (const s of sites)  byPilot[(s.pilotId ?? s.pilotid) as string]?.sites.push(s);
  for (const k of kpis)   byPilot[(k.pilotId ?? k.pilotid) as string]?.kpis.push(k);
  for (const o of outs)   byPilot[(o.pilotId ?? o.pilotid) as string]?.outcomes.push(o);
  for (const d of docs)   byPilot[(d.pilotId ?? d.pilotid) as string]?.docs.push(d);

  return NextResponse.json({
    data: Object.values(byPilot),
    license: "CC BY 4.0",
    generatedAt: new Date().toISOString()
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
