'use client'

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Pilot = {
  id: string;
  ref: string;
  title: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED";
  mission: "CLIMATE_POSITIVE" | "CARE_AT_EDGE" | "SOVEREIGN_AGRI" | "RESILIENT_TOWNS";
  summaryPublic: string;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  exportPotential: boolean;
};

const MISSIONS = [
  { key: "ALL", label: "All missions" },
  { key: "CLIMATE_POSITIVE", label: "Climate Positive" },
  { key: "CARE_AT_EDGE", label: "Care at Edge" },
  { key: "SOVEREIGN_AGRI", label: "Sovereign Agri" },
  { key: "RESILIENT_TOWNS", label: "Resilient Towns" },
] as const;

const STATUSES = ["ALL", "PLANNED", "IN_PROGRESS", "COMPLETED", "TERMINATED"] as const;

export default function HomePage() {
  const [mission, setMission] = useState<(typeof MISSIONS)[number]["key"]>("ALL");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (mission !== "ALL") params.set("mission", mission);
    if (status !== "ALL") params.set("status", status);
    setLoading(true);
    fetch(`/api/public/pilots?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setRows(d.data || []))
      .finally(() => setLoading(false));
  }, [q, mission, status]);

  const counts = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === "IN_PROGRESS").length;
    const completed = rows.filter((r) => r.status === "COMPLETED").length;
    return { total, active, completed };
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Mission tabs + status filter */}
      <div className="flex flex-wrap gap-2">
        {MISSIONS.map((m) => {
          const isActive = mission === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setMission(m.key)}
              className={`px-3 py-1.5 rounded-full border text-sm transition
                ${isActive
                  ? "bg-slate-200 text-slate-900 border-slate-200"
                  : "bg-transparent text-slate-200 border-slate-700 hover:border-slate-500"
                }`}
            >
              {m.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm opacity-80">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="bg-slate-900/40 border border-slate-700 rounded-lg p-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search + export buttons */}
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search pilots… (try: care at the edge, active, agri)"
          className="w-full bg-slate-900/40 border border-slate-700 rounded-xl p-3 outline-none"
        />
        <a className="text-sm underline" href="/api/public/export.csv" download>
          Export CSV
        </a>
        <a className="text-sm underline" href="/api/public/export.json" download>
          Export JSON
        </a>
        <a className="text-sm underline" href="/api/public/export-full.csv" download>
          Export‑Full CSV
        </a>
        <a className="text-sm underline" href="/api/public/export-full.json" download>
          Export‑Full JSON
        </a>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--card)] rounded-2xl p-4 border border-slate-800">
          <div className="text-sm opacity-80">Total</div>
          <div className="text-2xl font-semibold">{counts.total}</div>
        </div>
        <div className="bg-[var(--card)] rounded-2xl p-4 border border-slate-800">
          <div className="text-sm opacity-80">Active</div>
          <div className="text-2xl font-semibold">{counts.active}</div>
        </div>
        <div className="bg-[var(--card)] rounded-2xl p-4 border border-slate-800">
          <div className="text-sm opacity-80">Completed</div>
          <div className="text-2xl font-semibold">{counts.completed}</div>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="opacity-80">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="opacity-70">No pilots match the current filters.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((p) => (
            <Link
              key={p.id}
              href={`/pilot/${p.ref}`}
              className="block bg-[var(--card)] rounded-2xl p-5 border border-slate-800 hover:border-slate-600 transition"
            >
              <div className="text-xs uppercase opacity-70">
                {p.mission.replace(/_/g, " ")}
              </div>
              <h3 className="text-xl font-semibold mt-1">{p.title}</h3>
              <p className="opacity-90 mt-2 line-clamp-3">{p.summaryPublic}</p>
              <div className="mt-3 text-xs opacity-70">
                Status: {p.status.replace(/_/g, " ")} • Export: {p.exportPotential ? "Yes" : "No"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
