import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: { ref: string } }) {
  const p = await prisma.pilot.findUnique({
    where: { ref: params.ref },
    select: {
      id: true, ref: true, title: true, status: true, mission: true, summaryPublic: true,
      startDate: true, endDate: true, totalBudget: true, exportPotential: true, publishedAt: true,
      sites: { select: { id: true, name: true, town: true, region: true, lat: true, lng: true } },
      kpis: { select: { id: true, name: true, target: true } },
      // include KPI relation so we can show KPI names beside outcomes
      outcomes: {
        select: {
          id: true,
          achieved: true,
          kpiId: true,
          kpi: { select: { id: true, name: true, target: true } }
        }
      },
      funding: { select: { id: true, source: true, amountAud: true, confidential: true } },
      docs: { select: { id: true, label: true, url: true, public: true } },
    }
  });

  if (!p || !p.publishedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: p });
}
