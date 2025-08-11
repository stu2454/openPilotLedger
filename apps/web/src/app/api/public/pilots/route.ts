import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// --- helpers ---------------------------------------------------------------
function normalise(s?: string) {
  return (s ?? "").toLowerCase().trim();
}
function tokensOf(s: string) {
  // common typo fix + strip non-letters + tokenise
  const fixed = s.replace(/\bteh\b/g, "the").replace(/[^a-z\s]/g, " ");
  return fixed.split(/\s+/).filter(Boolean);
}

type Mission = "CLIMATE_POSITIVE" | "CARE_AT_EDGE" | "SOVEREIGN_AGRI" | "RESILIENT_TOWNS";
type Status = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED";

function inferMissionFromTokens(ts: string[]): Mission | undefined {
  const has = (w: string) => ts.includes(w);
  // care at edge (allow “care … edge”, “care at the edge”, etc.)
  if (has("care") && has("edge")) return "CARE_AT_EDGE";
  // climate positive (allow “climate” alone)
  if (has("climate") || (has("climate") && has("positive"))) return "CLIMATE_POSITIVE";
  // sovereign agri (allow “agri”, “agriculture”)
  if (has("sovereign") || has("agri") || has("agriculture")) return "SOVEREIGN_AGRI";
  // resilient towns (allow “resilience”, “resilient”, “towns”)
  if (has("resilient") || has("resilience") || has("towns") || has("town")) return "RESILIENT_TOWNS";
  return undefined;
}

function inferStatusFromTokens(ts: string[]): Status | undefined {
  const j = ts.join(" ");
  if (j.includes("active") || j.includes("in progress")) return "IN_PROGRESS";
  if (j.includes("planned") || j.includes("planning")) return "PLANNED";
  if (j.includes("complete") || j.includes("completed") || j.includes("finished")) return "COMPLETED";
  if (j.includes("terminated") || j.includes("stopped") || j.includes("cancelled")) return "TERMINATED";
  return undefined;
}

// --- handler ---------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qRaw = searchParams.get("q") || "";
  const statusParam = searchParams.get("status") || undefined;
  const missionParam = searchParams.get("mission") || undefined;

  const q = normalise(qRaw);
  const ts = tokensOf(q);

  const inferredMission = !missionParam ? inferMissionFromTokens(ts) : undefined;
  const inferredStatus = !statusParam ? inferStatusFromTokens(ts) : undefined;

  const where: any = {
    visibilityPublic: true,
    NOT: { publishedAt: null }
  };

  // Apply inferred/explicit mission & status
  if (missionParam || inferredMission) where.mission = (missionParam || inferredMission) as Mission;
  if (statusParam || inferredStatus) where.status = (statusParam || inferredStatus) as Status;

  // Only apply text search if we did NOT infer mission/status from the query.
  // This makes queries like "care at the edge" return all CARE_AT_EDGE pilots,
  // rather than only those whose title/summary literally contain the phrase.
  if (q && !inferredMission && !inferredStatus) {
    const or: any[] = [
      { title: { contains: q, mode: "insensitive" } },
      { summaryPublic: { contains: q, mode: "insensitive" } },
      { ref: { contains: q, mode: "insensitive" } },
    ];
    for (const t of ts) {
      or.push(
        { title: { contains: t, mode: "insensitive" } },
        { summaryPublic: { contains: t, mode: "insensitive" } },
        { ref: { contains: t, mode: "insensitive" } },
      );
    }
    where.OR = or;
  }

  const pilots = await prisma.pilot.findMany({
    where,
    select: {
      id: true, ref: true, title: true, status: true, mission: true, summaryPublic: true,
      startDate: true, endDate: true, totalBudget: true, exportPotential: true, publishedAt: true
    },
    orderBy: { publishedAt: "desc" }
  });

  return NextResponse.json({ data: pilots });
}
