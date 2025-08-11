import { NextResponse } from "next/server";
import { ensurePublicViews } from "@/lib/setupViews";

export async function GET() {
  await ensurePublicViews();
  return NextResponse.json({ ok: true });
}
