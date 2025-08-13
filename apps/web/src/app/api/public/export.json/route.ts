import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const data = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM public_api.v_pilots ORDER BY "publishedAt" DESC`);
  return NextResponse.json({ data, license: "CC BY 4.0", generatedAt: new Date().toISOString() }, {
    headers: { "Cache-Control": "public, max-age=300" }
  });
}
