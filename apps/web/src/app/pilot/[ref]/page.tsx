import { headers } from "next/headers";
import Link from "next/link";
import * as Tooltip from "@radix-ui/react-tooltip";

/** --------------------------- URL & Data --------------------------- */

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

/** --------------------------- KPI helpers --------------------------- */

type CompareKind = "gte" | "lte" | "pos" | "neg";
type UnitKind = "percent" | "absolute";
type Parsed = { kind: CompareKind; value: number; unit: UnitKind; raw: string } | null;

const ONTRACK_MARGIN_PP = Number(process.env.ONTRACK_MARGIN_PP ?? 5);
const ONTRACK_RATIO = Number(process.env.ONTRACK_RATIO ?? 0.75);
const ONTRACK_ABS_MARGIN_RATIO = Number(process.env.ONTRACK_ABS_MARGIN_RATIO ?? 0.10);

function hasPercent(s?: string | null) {
  return !!s && /%/.test(s);
}

function numFrom(s?: string | null): number | null {
  if (!s) return null;
  const m = String(s).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function parseTarget(raw?: string | null): Parsed {
  if (!raw) return null;
  const s = raw.trim();
  const unit: UnitKind = hasPercent(s) ? "percent" : "absolute";
  const v = numFrom(s);
  if (v == null) return null;

  if (/[≥>]=?/.test(s)) return { kind: "gte", value: v, unit, raw: s };
  if (/[≤<]=?/.test(s)) return { kind: "lte", value: v, unit, raw: s };

  if (s.startsWith("-")) return { kind: "neg", value: v, unit, raw: s };
  if (s.startsWith("+")) return { kind: "pos", value: v, unit, raw: s };

  return { kind: "gte", value: v, unit, raw: s };
}

/** Compare achieved value against the target threshold */
function meetsTarget(target: Exclude<Parsed, null>, achievedNum: number) {
  const { kind, value: t } = target;
  const a = achievedNum;

  // Treat 'pos' as "higher is better" and 'neg' as "lower is better"
  if (kind === "gte" || kind === "pos") return a >= t;
  if (kind === "lte" || kind === "neg") return a <= t;

  // Fallback (shouldn't occur with current ParseKind)
  return false;
}

/** How far along you are toward the target (1 = at/over target for gte/pos) */
function progressRatio(target: Exclude<Parsed, null>, achievedNum: number) {
  const { kind, value: t } = target;
  const a = achievedNum;

  // Guard against divide-by-zero
  const safeT = t === 0 ? 1e-9 : t;

  if (kind === "gte" || kind === "pos") return a / safeT;
  if (kind === "lte" || kind === "neg") return (safeT - a) / safeT;

  return 0;
}

type State = "met" | "on" | "off" | "na";

function decideState(target: Parsed, achievedRaw?: string | null) {
  if (!target) return { state: "na" as State, ratioPct: 0, tip: "No target available." };

  const aNum = numFrom(achievedRaw ?? "");
  if (aNum == null) {
    return { state: "na" as State, ratioPct: 0, tip: "No achieved value available." };
  }

  const met = meetsTarget(target, aNum);
  const ratio = Math.max(0, progressRatio(target, aNum));
  const ratioPct = Math.round(Math.min(1, ratio) * 100);

  if (met) {
    return {
      state: "met" as State,
      ratioPct,
      tip: `Target met: achieved ${achievedRaw} vs target ${target.raw}.`,
    };
  }

  // For directional targets, use margins; otherwise use a generic ratio rule
  if (target.kind === "gte" || target.kind === "lte" || target.kind === "pos" || target.kind === "neg") {
    if (target.unit === "percent") {
      const marginPP = Math.abs(aNum - target.value);
      if (marginPP <= ONTRACK_MARGIN_PP) {
        return {
          state: "on" as State,
          ratioPct,
          tip: `Within ${ONTRACK_MARGIN_PP}pp of target: achieved ${achievedRaw} vs target ${target.raw}.`,
        };
      }
      return {
        state: "off" as State,
        ratioPct,
        tip: `Further than ${ONTRACK_MARGIN_PP}pp from target: achieved ${achievedRaw} vs target ${target.raw}.`,
      };
    } else {
      const rel = Math.abs(aNum - target.value) / (Math.abs(target.value) || 1);
      if (rel <= ONTRACK_ABS_MARGIN_RATIO) {
        return {
          state: "on" as State,
          ratioPct,
          tip: `Within ${Math.round(ONTRACK_ABS_MARGIN_RATIO * 100)}% of target: achieved ${achievedRaw} vs target ${target.raw}.`,
        };
      }
      return {
        state: "off" as State,
        ratioPct,
        tip: `Outside ${Math.round(ONTRACK_ABS_MARGIN_RATIO * 100)}% margin: achieved ${achievedRaw} vs target ${target.raw}.`,
      };
    }
  }

  const frac = Math.round(ratio * 100);
  if (ratio >= ONTRACK_RATIO) {
    return {
      state: "on" as State,
      ratioPct,
      tip: `${Math.round(ONTRACK_RATIO * 100)}% of goal reached (${frac}%): achieved ${achievedRaw} vs target ${target.raw}.`,
    };
  }
  return {
    state: "off" as State,
    ratioPct,
    tip: `Only ${frac}% of goal reached (< ${Math.round(ONTRACK_RATIO * 100)}%): achieved ${achievedRaw} vs target ${target.raw}.`,
  };
}

function chipTone(state: State) {
  if (state === "met") return "bg-green-600/25 text-green-200";
  if (state === "on") return "bg-yellow-600/25 text-yellow-200";
  if (state === "off") return "bg-red-600/25 text-red-200";
  return "bg-slate-600/25 text-slate-300";
}

function barTone(state: State) {
  if (state === "met") return "bg-green-500";
  if (state === "on") return "bg-yellow-400";
  if (state === "off") return "bg-red-500";
  return "bg-slate-600";
}

function ProgressRow({
  label,
  target,
  achieved,
}: {
  label: string;
  target?: string | null;
  achieved?: string | null;
}) {
  const tParsed = parseTarget(target);
  const { state, ratioPct, tip } = decideState(tParsed, achieved);

  const chip =
    state === "met" ? "Met" : state === "on" ? "On track" : state === "off" ? "Off track" : "No data";

  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 leading-6">
          <span className="opacity-70">{label}:</span>{" "}
          <span className="opacity-90">target {target ?? "—"}</span>
          {" • "}
          <span className="opacity-90">achieved {achieved ?? "—"}</span>

          <Tooltip.Provider delayDuration={150}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <span
                  className={`ml-2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium cursor-help ${chipTone(
                    state
                  )}`}
                >
                  {chip}
                </span>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="top"
                  align="center"
                  className="z-50 rounded-md bg-slate-800 px-3 py-2 text-xs text-white shadow-lg border border-slate-700 max-w-xs"
                >
                  {tip}
                  <Tooltip.Arrow className="fill-slate-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
      </div>

      <div className="mt-1 h-1.5 w-full rounded bg-slate-800 overflow-hidden border border-slate-700/60">
        <div className={`h-full ${barTone(state)}`} style={{ width: `${ratioPct}%` }} />
      </div>
    </li>
  );
}

/** --------------------------- Page --------------------------- */

export default async function PilotPage({ params }: { params: { ref: string } }) {
  const data = await getData(params.ref);
  if (!data?.data) return <div className="p-6">Not found</div>;
  const p = data.data;

  const kpiById: Record<string, any> = {};
  for (const k of p.kpis ?? []) kpiById[k.id] = k;

  return (
    <div className="space-y-6">
      <Link className="text-sm underline" href="/">← Back</Link>

      <div className="bg-[var(--card)] rounded-2xl p-6 border border-slate-800">
        <div className="text-xs uppercase opacity-70">{String(p.mission || "").replace(/_/g, " ")}</div>
        <h1 className="text-2xl font-semibold">{p.title}</h1>
        <div className="mt-1 text-sm opacity-80">Status: {p.status.replace(/_/g, " ")}</div>
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
        <div className="bg-[var(--card)] rounded-2xl p-6 border border-slate-800">
          <h2 className="font-semibold">KPI Targets</h2>
          <ul className="list-disc list-inside mt-2 space-y-1.5">
            {(p.kpis ?? []).map((k: any) => (
              <li key={k.id} className="leading-6">
                <span className="opacity-70">{k.name}:</span> {k.target ?? "—"}
              </li>
            ))}
            {(p.kpis ?? []).length === 0 && <li className="opacity-70">No KPIs defined.</li>}
          </ul>
        </div>

        <div className="bg-[var(--card)] rounded-2xl p-6 border border-slate-800">
          <h2 className="font-semibold">Outcomes</h2>
          <ul className="mt-2 divide-y divide-slate-800">
            {(p.outcomes ?? []).map((o: any) => {
              const k = o.kpi ?? kpiById[o.kpiId ?? ""];
              const label = k?.name ?? "Outcome";
              const target = k?.target ?? "—";
              const achieved = o.achieved ?? "—";
              return <ProgressRow key={o.id} label={label} target={target} achieved={achieved} />;
            })}
            {(p.outcomes ?? []).length === 0 && (
              <li className="py-2 opacity-70">No outcomes reported yet.</li>
            )}
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
          {(p.docs ?? []).filter((d: any) => d.public).length === 0 && (
            <li className="opacity-70">No public documents.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
