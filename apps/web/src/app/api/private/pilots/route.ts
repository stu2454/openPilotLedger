import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = await prisma.pilot.create({
    data: {
      ref: body.ref, title: body.title, mission: body.mission, problemOwnerId: body.problemOwnerId,
      guildLead: body.guildLead, summaryPublic: body.summaryPublic, status: body.status || "PLANNED"
    }
  });
  return NextResponse.json({ data: created });
}
