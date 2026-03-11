"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel, StatCard, StatusBadge } from "@terroiros/ui";

type CaseRecord = {
  caseId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
  reason: string;
  decisionId: string;
  eventId: string;
};

type PublicReport = {
  totals: {
    ingestedEvents: number;
    decisions: number;
    approvedDecisions: number;
    approvedPayoutTotal: number;
  };
  latestBasisRisk: {
    expectedGap: number;
    flaggedCases: number;
  } | null;
};

type BasisRiskResponse = {
  averageExpectedGap: number;
  observations: number;
  latest: {
    expectedGap: number;
    flaggedCases: number;
  } | null;
  history: Array<{
    generatedAt: string;
    expectedGap: number;
    flaggedCases: number;
  }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-user-role": "admin",
      "x-user-id": "dashboard-operator",
      ...(options?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function toneForSeverity(severity: CaseRecord["severity"]): "neutral" | "warning" | "critical" | "success" {
  if (severity === "CRITICAL") return "critical";
  if (severity === "HIGH") return "warning";
  if (severity === "MEDIUM") return "warning";
  return "success";
}

export default function ShieldDashboard() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [publicReport, setPublicReport] = useState<PublicReport | null>(null);
  const [basisRisk, setBasisRisk] = useState<BasisRiskResponse | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const criticalCount = useMemo(
    () => cases.filter((item) => item.severity === "CRITICAL" || item.severity === "HIGH").length,
    [cases]
  );

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setLoading(true);
        const [casesResponse, reportResponse, basisResponse] = await Promise.all([
          apiFetch<{ cases: CaseRecord[] }>("/v1/cases"),
          apiFetch<PublicReport>("/v1/reports/public?programId=program-kakheti-2026"),
          apiFetch<BasisRiskResponse>("/v1/basis-risk/metrics?programId=program-kakheti-2026")
        ]);

        setCases(casesResponse.cases);
        setSelectedCase(casesResponse.cases[0] ?? null);
        setPublicReport(reportResponse);
        setBasisRisk(basisResponse);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function approveDecision(decisionId: string): Promise<void> {
    await apiFetch(`/v1/decisions/${decisionId}/approve`, { method: "POST", body: "{}" });
    const refreshed = await apiFetch<{ cases: CaseRecord[] }>("/v1/cases");
    setCases(refreshed.cases);
    setSelectedCase(refreshed.cases.find((item) => item.caseId === selectedCase?.caseId) ?? refreshed.cases[0] ?? null);
  }

  async function exportDecision(decisionId: string): Promise<void> {
    await apiFetch(`/v1/decisions/${decisionId}/export`, { method: "POST", body: "{}" });
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Terroir Shield</p>
          <h1>Climate Response Command Center</h1>
          <p className="subtitle">
            Trigger logic, decision workflows, basis-risk governance, and public reporting in one auditable operations cockpit.
          </p>
        </div>
        <div className="hero-actions">
          <StatusBadge label="Runtime: MOCK" tone="warning" />
          <StatusBadge label="Program: Kakheti 2026" tone="success" />
        </div>
      </header>

      {error ? <p className="error-banner">Failed to load dashboard data: {error}</p> : null}

      <section className="stat-grid">
        <StatCard label="Ingested Events" value={publicReport?.totals.ingestedEvents ?? 0} detail="Weather + oracle packets" />
        <StatCard label="Open Cases" value={cases.length} tone={criticalCount > 0 ? "warning" : "success"} detail={`${criticalCount} high severity`} />
        <StatCard label="Approved Payouts" value={publicReport?.totals.approvedDecisions ?? 0} detail={`GEL ${publicReport?.totals.approvedPayoutTotal ?? 0}`} tone="success" />
        <StatCard label="Basis Risk Gap" value={basisRisk?.averageExpectedGap ?? 0} detail={`${basisRisk?.observations ?? 0} snapshots`} tone={(basisRisk?.averageExpectedGap ?? 0) > 1000 ? "critical" : "warning"} />
      </section>

      <section className="content-grid">
        <Panel title="Event Monitor" subtitle="Recent climate evidence intake and trigger status">
          <div className="event-strip">
            <div className="map-card">
              <svg viewBox="0 0 320 190" aria-hidden="true">
                <defs>
                  <linearGradient id="field" x1="0" x2="1">
                    <stop offset="0%" stopColor="#9cb08a" />
                    <stop offset="100%" stopColor="#607f5f" />
                  </linearGradient>
                </defs>
                <rect x="10" y="10" width="300" height="170" rx="16" fill="url(#field)" opacity="0.8" />
                <circle cx="120" cy="96" r="24" fill="#d2e0bf" opacity="0.7" />
                <circle cx="180" cy="86" r="18" fill="#e5efcf" opacity="0.7" />
                <path d="M70 146 L255 52" stroke="#e6d89f" strokeWidth="4" strokeLinecap="round" />
                <circle cx="190" cy="76" r="9" fill="#c14343" />
              </svg>
              <p>Kakheti pilot zone with latest hail cluster around Akhmeta corridor.</p>
            </div>
            <div className="timeline-card">
              <ol>
                <li><strong>14:08 UTC</strong> Weather packet signed and ingested.</li>
                <li><strong>14:09 UTC</strong> Threshold evaluation queued.</li>
                <li><strong>14:10 UTC</strong> Cases generated for impacted enrollments.</li>
                <li><strong>14:12 UTC</strong> Review queue escalated for low-trust records.</li>
              </ol>
            </div>
          </div>
        </Panel>

        <Panel title="Decision Queue" subtitle="Approve, hold, or export payout decisions">
          {loading ? <p>Loading cases...</p> : null}
          {!loading && cases.length === 0 ? <p>No active cases yet. Ingest a weather event to start.</p> : null}
          <div className="queue-list">
            {cases.map((item) => (
              <button
                key={item.caseId}
                className={`queue-item ${selectedCase?.caseId === item.caseId ? "selected" : ""}`}
                onClick={() => setSelectedCase(item)}
              >
                <span>
                  <strong>{item.caseId.slice(0, 8)}</strong>
                  <small>{item.reason}</small>
                </span>
                <StatusBadge label={item.severity} tone={toneForSeverity(item.severity)} />
              </button>
            ))}
          </div>

          {selectedCase ? (
            <div className="action-row">
              <button onClick={() => approveDecision(selectedCase.decisionId)}>Approve Decision</button>
              <button className="secondary" onClick={() => exportDecision(selectedCase.decisionId)}>
                Export to Treasury
              </button>
            </div>
          ) : null}
        </Panel>

        <Panel title="Case Detail" subtitle="Evidence chain and policy context">
          {!selectedCase ? <p>Select a case to inspect details.</p> : null}
          {selectedCase ? (
            <div className="detail-grid">
              <p><strong>Case:</strong> {selectedCase.caseId}</p>
              <p><strong>Event:</strong> {selectedCase.eventId}</p>
              <p><strong>Decision:</strong> {selectedCase.decisionId}</p>
              <p><strong>Status:</strong> {selectedCase.status}</p>
              <p><strong>Reason:</strong> {selectedCase.reason}</p>
              <p><strong>Manual review:</strong> {selectedCase.status === "UNDER_REVIEW" ? "Required" : "No"}</p>
            </div>
          ) : null}
        </Panel>

        <Panel title="Basis Risk Analytics" subtitle="Gap visibility across snapshots">
          <div className="basis-chart" aria-label="basis risk bars">
            {(basisRisk?.history ?? []).slice(0, 8).map((snap, index) => (
              <div key={`${snap.generatedAt}-${index}`} className="bar-wrap">
                <span
                  className="bar"
                  style={{ height: `${Math.min(100, Math.max(8, snap.expectedGap / 20))}%` }}
                  title={`Expected gap ${snap.expectedGap}`}
                />
                <small>{snap.flaggedCases} flagged</small>
              </div>
            ))}
          </div>
          <p className="muted">Large expected-gap bars route cases to dispute workflows to reduce basis-risk harm.</p>
        </Panel>

        <Panel title="Public Reporting Preview" subtitle="Aggregated non-PII transparency output">
          <ul className="public-list">
            <li>Program: Kakheti Climate Relief 2026</li>
            <li>Events ingested: {publicReport?.totals.ingestedEvents ?? 0}</li>
            <li>Decisions issued: {publicReport?.totals.decisions ?? 0}</li>
            <li>Approved payouts: GEL {publicReport?.totals.approvedPayoutTotal ?? 0}</li>
            <li>PII exposure: none</li>
          </ul>
        </Panel>

        <Panel title="Governance Admin" subtitle="Threshold and rule version controls">
          <table className="governance-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Value</th>
                <th>Version</th>
                <th>Window</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>hail threshold (h*)</td>
                <td>0.60</td>
                <td>1.0.0</td>
                <td>2026 season</td>
              </tr>
              <tr>
                <td>frost threshold (f*)</td>
                <td>1</td>
                <td>1.0.0</td>
                <td>2026 season</td>
              </tr>
              <tr>
                <td>min temp threshold (t*)</td>
                <td>-1 C</td>
                <td>1.0.0</td>
                <td>2026 season</td>
              </tr>
            </tbody>
          </table>
        </Panel>
      </section>
    </main>
  );
}
