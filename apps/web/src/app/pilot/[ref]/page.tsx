import { headers } from "next/headers";
import Link from "next/link";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

async function getData(ref: string) {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/public/pilots/${ref}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function PilotPage({ params }: { params: { ref: string } }) {
  const data = await getData(params.ref);
  if (!data?.data) return <div className="p-6">Not found</div>;
  const p = data.data;

  // Build a lookup of KPI targets by id for quick pairing
  const kpiById: Record<string, any> = {};
  for (const k of p.kpis ?? []) kpiById[k.id] = k;

  return (
    <div className="space-y-6">
      <Link className="text-sm underline" href="/">← Back</Link>

      <div className="bg-[var(--card)] rounded-2xl p-6 border border-slate-800">
        <div className="text-xs uppercase opacity-70">{String(p.mission || "").replace(/_/g, " ")}</div>
        <h1 className="text-2xl font-semibold">{p.title}</h1>
        <div className="mt-2 text-sm opacity-80">Status: {p.status}</div>
        <p className="mt-4 leading-relaxed">{p.summaryPublic}</p>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/40 p-4 rounded-xl">
            <div className="text-sm opacity-80">Timeline</div>
            <div className="mt-1 text-sm">
              {(p.startDate ?? "").slice(0, 10)} → {p.endDate ? String(p.endDate).slice(0, 10) : "TBC"}
            </div>
          </div>
          <div className="bg-slate-900/40 p-4 rounded-xl">
            <div className="text-sm opacity-80">Budget (AUD)</div>
            <div className="mt-1 text-lg">{p.totalBudget ?? "—"}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* KPI Targets */}
        <div className="bg-[var(--card)] rounded-2xl p-6 border border-slate-800">
          <h2 className="font-semibold">KPI Targets</h2>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {(p.kpis ?? []).map((k: any) => (
              <li key={k.id}>
                <span className="opacity-70">{k.name}:</span> {k.target ?? "—"}
              </li>
            ))}
          </ul>
        </div>

        {/* Outcomes paired with KPI names */}
        <div className="bg-[var(--card)] rounded-2xl p-6 border border-slate-800">
          <h2 className="font-semibold">Outcomes</h2>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {(p.outcomes ?? []).map((o: any) => {
              const k = o.kpi ?? kpiById[o.kpiId ?? ""];
              const label = k?.name ?? "Outcome";
              const target = k?.target ?? "—";
              const achieved = o.achieved ?? "—";
              return (
                <li key={o.id}>
                  <span className="opacity-70">{label}:</span>{" "}
                  <span>target {target} • achieved {achieved}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-2xl p-6 border border-slate-800">
        <h2 className="font-semibold">Documents</h2>
        <ul className="list-disc list-inside mt-2 space-y-1">
          {(p.docs ?? [])
            .filter((d: any) => d.public)
            .map((d: any) => (
              <li key={d.id}>
                <a className="underline" href={d.url} target="_blank" rel="noreferrer">
                  {d.label}
                </a>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
