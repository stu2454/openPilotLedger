import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function toCsv(rows: any[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    const t = s.replace(/"/g, '""');
    return /[",\n]/.test(t) ? `"${t}"` : t;
  };
  return [headers.join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\n");
}

export async function GET() {
  const pilots = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_pilots ORDER BY "publishedAt" DESC`);
  const sites  = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_sites`);
  const kpis   = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_kpis`);
  const outs   = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_outcomes`);
  const docs   = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_docs`);

  const data = pilots.map(p => {
    const pid = p.id;
    return {
      ...p,
      sites: JSON.stringify(sites.filter(s => (s.pilotId ?? s.pilotid) === pid)),
      kpis: JSON.stringify(kpis.filter(k => (k.pilotId ?? k.pilotid) === pid)),
      outcomes: JSON.stringify(outs.filter(o => (o.pilotId ?? o.pilotid) === pid)),
      docs: JSON.stringify(docs.filter(d => (d.pilotId ?? d.pilotid) === pid)),
    };
  });

  const csv = toCsv(data);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="opl_export_full_${Date.now()}.csv"`,
      "Cache-Control": "public, max-age=300",
      "X-Data-License": "CC BY 4.0"
    }
  });
}
