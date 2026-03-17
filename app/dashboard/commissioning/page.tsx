"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { getSupabase } from "../../../lib/supabase";

type Inspection = {
  id: number;
  title: string;
  status: string;
  assigned_to: string;
  due_date: string;
};

export default function Commissioning() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Pending");

  async function fetchInspections() {
    const { data, error } = await getSupabase().from("commissioning").select("*");
    if (!error && data) setInspections(data);
  }

  useEffect(() => { fetchInspections(); }, []);

  async function handleAddInspection() {
    if (!title) return;
    await getSupabase().from("commissioning").insert({ title, assigned_to: assignedTo, due_date: dueDate, status });
    setTitle(""); setAssignedTo(""); setDueDate(""); setStatus("Pending");
    setShowForm(false);
    await fetchInspections();
  }

  const inputStyle = { background: "#111", border: "1px solid #333", borderRadius: "6px", padding: "10px 14px", fontSize: "14px", color: "#fff", width: "100%", boxSizing: "border-box" as const };
  const statusColor = (s: string) => s === "Completed" ? "#4ade80" : s === "In Progress" ? "#60a5fa" : s === "Failed" ? "#f87171" : "#fbbf24";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="commissioning" />

      <main style={{ flex: 1, padding: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "48px" }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "36px", letterSpacing: "-1px", marginBottom: "8px" }}>Commissioning</h2>
            <p style={{ color: "#666", fontSize: "15px" }}>Track inspections and sign-offs.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ background: "#f5a623", color: "#000", padding: "12px 24px", borderRadius: "6px", fontSize: "14px", fontWeight: "700", border: "none", cursor: "pointer" }}>
            + Add Inspection
          </button>
        </div>

        {showForm && (
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "32px", maxWidth: "480px", marginBottom: "40px" }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", marginBottom: "24px" }}>New Inspection</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input style={inputStyle} placeholder="Inspection title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input style={inputStyle} placeholder="Assigned to" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
              <input type="date" style={inputStyle} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Failed</option>
              </select>
              <button onClick={handleAddInspection} style={{ background: "#f5a623", color: "#000", padding: "12px", borderRadius: "6px", fontSize: "14px", fontWeight: "700", border: "none", cursor: "pointer", marginTop: "8px" }}>
                Save Inspection
              </button>
            </div>
          </div>
        )}

        {inspections.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "120px" }}>
            <p style={{ fontSize: "48px" }}>✅</p>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", margin: "16px 0 8px" }}>No inspections yet</h3>
            <p style={{ color: "#666" }}>Add your first inspection to get started.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid #222", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 24px", borderBottom: "1px solid #222", background: "#111" }}>
              {["Title", "Assigned To", "Due Date", "Status"].map((h) => (
                <span key={h} style={{ color: "#444", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>{h}</span>
              ))}
            </div>
            {inspections.map((inspection) => (
              <div key={inspection.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "16px 24px", borderBottom: "1px solid #161616", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: "500" }}>{inspection.title}</span>
                <span style={{ color: "#666", fontSize: "14px" }}>{inspection.assigned_to}</span>
                <span style={{ color: "#666", fontSize: "14px" }}>{inspection.due_date}</span>
                <span style={{ color: statusColor(inspection.status), fontSize: "13px", fontWeight: "700" }}>{inspection.status}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}