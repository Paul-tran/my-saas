"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import ErrorBanner from "../../components/ErrorBanner";
import { useCommissioning } from "../../../lib/hooks/useCommissioning";
import { STATUS_LABELS } from "../../../lib/models/commissioning";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  not_started: { bg: "#f3f4f5", color: "#524534" },
  in_progress:  { bg: "#dbeafe", color: "#1d4ed8" },
  completed:    { bg: "#dcfce7", color: "#15803d" },
  failed:       { bg: "#fee2e2", color: "#dc2626" },
};

const KPI_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  not_started: { bg: "#f3f4f5",  color: "#524534", icon: "radio_button_unchecked" },
  in_progress:  { bg: "#dbeafe", color: "#1d4ed8", icon: "autorenew" },
  completed:    { bg: "#dcfce7", color: "#15803d", icon: "check_circle" },
  failed:       { bg: "#fee2e2", color: "#dc2626", icon: "cancel" },
};

export default function Commissioning() {
  const { records, loading, error, handleAddRecord } = useCommissioning();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    await handleAddRecord({ name, assigned_to: assignedTo });
    setName(""); setAssignedTo("");
    setShowForm(false);
  }

  const counts = {
    not_started: records.filter((r) => r.overall_status === "not_started").length,
    in_progress: records.filter((r) => r.overall_status === "in_progress").length,
    completed:   records.filter((r) => r.overall_status === "completed").length,
    failed:      records.filter((r) => r.overall_status === "failed").length,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8f9fa", fontFamily: "var(--font-inter, Inter, sans-serif)", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <Sidebar active="commissioning" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(215,195,174,0.2)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: records.length > 0 ? "24px" : 0 }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.3em", display: "block", marginBottom: "4px" }}>
                Project Management
              </span>
              <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "32px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em" }}>Commissioning</h1>
              <p style={{ color: "#524534", fontSize: "13px", margin: "4px 0 0" }}>Track commissioning records and inspections</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{ background: "linear-gradient(135deg, #835500, #f5a623)", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}
            >
              + Add Record
            </button>
          </div>

          {/* KPI cards */}
          {records.length > 0 && (
            <div style={{ display: "flex", gap: "12px" }}>
              {(["not_started", "in_progress", "completed", "failed"] as const).map((status) => {
                const s = KPI_STYLE[status];
                return (
                  <div key={status} style={{ background: s.bg, borderRadius: "10px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px", minWidth: "120px" }}>
                    <span className="material-symbols-outlined" style={{ color: s.color, fontSize: "20px" }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: s.color, fontFamily: "var(--font-manrope, Manrope, sans-serif)", lineHeight: 1 }}>{counts[status]}</div>
                      <div style={{ fontSize: "11px", color: s.color, opacity: 0.8, marginTop: "2px", fontWeight: 500 }}>{STATUS_LABELS[status] ?? status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 40px" }}>
          {error && <ErrorBanner message={error} />}

          {loading && <div style={{ textAlign: "center", padding: "80px" }}><p style={{ color: "#857462" }}>Loading...</p></div>}

          {!loading && records.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#d7c3ae", display: "block", marginBottom: "16px" }}>verified</span>
              <p style={{ fontSize: "16px", color: "#191c1d", marginBottom: "6px", fontWeight: 700, fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}>No commissioning records yet</p>
              <p style={{ fontSize: "13px", color: "#524534" }}>Add your first record to get started.</p>
            </div>
          )}

          {!loading && records.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f5" }}>
                    {["Name", "Assigned To", "Status"].map((h) => (
                      <th key={h} style={{ padding: "12px 24px", fontSize: "10px", color: "#524534", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const s = STATUS_STYLE[record.overall_status] ?? { bg: "#f3f4f5", color: "#524534" };
                    return (
                      <tr key={record.id} style={{ borderBottom: "1px solid rgba(215,195,174,0.15)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "16px 24px", fontSize: "14px", color: "#191c1d", fontWeight: 500 }}>{record.name}</td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "#524534" }}>{record.assigned_to || "—"}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: s.bg, color: s.color, textTransform: "capitalize" }}>
                            {STATUS_LABELS[record.overall_status] ?? record.overall_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add record modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(25,28,29,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", width: "440px", boxShadow: "0 40px 80px rgba(25,28,29,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ color: "#191c1d", margin: 0, fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "20px", fontWeight: 700 }}>New Commissioning Record</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#857462", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Record name"
                style={{ background: "#f3f4f5", border: "none", color: "#191c1d", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", outline: "none" }} />
              <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Assigned to (optional)"
                style={{ background: "#f3f4f5", border: "none", color: "#191c1d", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", outline: "none" }} />
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: "none", border: "1px solid rgba(215,195,174,0.4)", color: "#857462", borderRadius: "8px", padding: "10px", cursor: "pointer", fontSize: "13px" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, background: "linear-gradient(135deg, #835500, #f5a623)", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
