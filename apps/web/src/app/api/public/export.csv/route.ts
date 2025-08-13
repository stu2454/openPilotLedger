import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toCsv(rows: any[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\n");
}

export async function GET() {
  const data = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_pilots ORDER BY "publishedAt" DESC`);
  const csv = toCsv(data);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="opl_export_${Date.now()}.csv"`,
      "Cache-Control": "public, max-age=300",
      "X-Data-License": "CC BY 4.0"
    }
  });
}
