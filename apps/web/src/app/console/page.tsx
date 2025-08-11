'use client'
import { useState } from "react";

export default function ConsolePage() {
  const [payload, setPayload] = useState(`{
  "ref": "DEMO-2025-002",
  "title": "Demo Pilot",
  "mission": "RESILIENT_TOWNS",
  "problemOwnerId": "",
  "guildLead": "Demo Lead Pty Ltd",
  "summaryPublic": "A short public summary"
}`);
  const [resp, setResp] = useState("");

  async function createPilot() {
    const r = await fetch("/api/private/pilots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    });
    const j = await r.json();
    setResp(JSON.stringify(j, null, 2));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Internal Console (prototype)</h1>
      <p className="opacity-80">Create pilot via private API (no auth in prototype).</p>
      <textarea value={payload} onChange={e=>setPayload(e.target.value)} rows={12}
        className="w-full bg-slate-900/40 border border-slate-700 rounded-xl p-3 font-mono text-sm" />
      <button onClick={createPilot} className="px-4 py-2 rounded-lg bg-slate-200 text-slate-900">POST /api/private/pilots</button>
      <pre className="bg-slate-900/40 p-3 rounded-xl whitespace-pre-wrap">{resp}</pre>
    </div>
  );
}
