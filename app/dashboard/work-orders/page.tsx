"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ErrorBanner from "../../components/ErrorBanner";
import { useWorkOrders } from "../../../lib/hooks/useWorkOrders";
import { PRIORITY_COLOR, PRIORITY_LABEL, STATUS_COLOR, STATUS_LABEL } from "../../../lib/models/workorders";
import { CATEGORY_COLOR } from "../../../lib/models/wotypes";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "on_hold", label: "On Hold" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const KPI_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  Open:        { bg: "#dbeafe", color: "#1d4ed8", icon: "inbox" },
  "In Progress": { bg: "#fef9c3", color: "#a16207", icon: "autorenew" },
  "On Hold":   { bg: "#f3f4f5", color: "#524534", icon: "pause_circle" },
  Completed:   { bg: "#dcfce7", color: "#15803d", icon: "check_circle" },
  Overdue:     { bg: "#fee2e2", color: "#dc2626", icon: "warning" },
};

export default function WorkOrdersPage() {
  const { workOrders, loading, error } = useWorkOrders();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const filtered = workOrders
    .filter((w) => filterStatus === "all" || w.status === filterStatus)
    .filter((w) => filterPriority === "all" || w.priority === filterPriority);

  const overdue = workOrders.filter((w) =>
    w.due_date && new Date(w.due_date) < new Date() && w.status !== "completed" && w.status !== "cancelled"
  ).length;

  const kpis = [
    { label: "Open", count: workOrders.filter((w) => w.status === "open").length },
    { label: "In Progress", count: workOrders.filter((w) => w.status === "in_progress").length },
    { label: "On Hold", count: workOrders.filter((w) => w.status === "on_hold").length },
    { label: "Completed", count: workOrders.filter((w) => w.status === "completed").length },
    { label: "Overdue", count: overdue },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8f9fa", fontFamily: "var(--font-inter, Inter, sans-serif)", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <Sidebar active="work-orders" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(215,195,174,0.2)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "24px" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.3em", display: "block", marginBottom: "4px" }}>
                Maintenance & Operations
              </span>
              <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "32px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em" }}>
                Work Orders
              </h1>
              <p style={{ color: "#524534", fontSize: "13px", margin: "4px 0 0" }}>Manage and track all maintenance and operational tasks</p>
            </div>
            <Link href="/dashboard/work-orders/new" style={{
              background: "linear-gradient(135deg, #835500, #f5a623)",
              color: "#fff", borderRadius: "8px", padding: "12px 24px",
              fontSize: "13px", fontWeight: 700, textDecoration: "none",
              display: "flex", alignItems: "center", gap: "8px",
              fontFamily: "var(--font-manrope, Manrope, sans-serif)",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add_circle</span>
              New Work Order
            </Link>
          </div>

          {/* KPI cards */}
          <div style={{ display: "flex", gap: "12px" }}>
            {kpis.map((k) => {
              const s = KPI_STYLE[k.label] ?? { bg: "#f3f4f5", color: "#524534", icon: "info" };
              return (
                <div key={k.label} style={{ background: s.bg, borderRadius: "10px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px", minWidth: "120px" }}>
                  <span className="material-symbols-outlined" style={{ color: s.color, fontSize: "20px" }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: s.color, fontFamily: "var(--font-manrope, Manrope, sans-serif)", lineHeight: 1 }}>{k.count}</div>
                    <div style={{ fontSize: "11px", color: s.color, opacity: 0.8, marginTop: "2px", fontWeight: 500 }}>{k.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 40px" }}>
          {error && <ErrorBanner message={error} />}

          {/* Filter bar */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "6px", background: "#fff", padding: "4px", borderRadius: "10px", boxShadow: "0 1px 4px rgba(25,28,29,0.08)" }}>
              {STATUS_FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilterStatus(f.key)} style={{
                  padding: "6px 14px", borderRadius: "7px", border: "none",
                  background: filterStatus === f.key ? "#f5a623" : "transparent",
                  color: filterStatus === f.key ? "#fff" : "#524534",
                  fontSize: "12px", fontWeight: filterStatus === f.key ? 700 : 400, cursor: "pointer",
                }}>
                  {f.label}
                </button>
              ))}
            </div>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
              style={{ marginLeft: "auto", background: "#fff", border: "none", color: "#524534", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", boxShadow: "0 1px 4px rgba(25,28,29,0.08)", cursor: "pointer" }}>
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {loading && <div style={{ textAlign: "center", padding: "80px" }}><p style={{ color: "#857462" }}>Loading work orders...</p></div>}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#d7c3ae", display: "block", marginBottom: "16px" }}>assignment</span>
              <p style={{ fontSize: "16px", color: "#191c1d", marginBottom: "6px", fontWeight: 700, fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}>
                {workOrders.length === 0 ? "No work orders yet." : "No work orders match your filters."}
              </p>
              {workOrders.length === 0 && (
                <Link href="/dashboard/work-orders/new" style={{ background: "linear-gradient(135deg, #835500, #f5a623)", color: "#fff", borderRadius: "8px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                  Create your first work order
                </Link>
              )}
            </div>
          )}

          {filtered.length > 0 && (
            <div style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f5" }}>
                    {["WO #", "Title", "Type", "Priority", "Status", "Assigned To", "Due Date", ""].map((h) => (
                      <th key={h} style={{ padding: "12px 20px", fontSize: "10px", color: "#524534", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((wo) => {
                    const isOverdue = wo.due_date && new Date(wo.due_date) < new Date() && wo.status !== "completed" && wo.status !== "cancelled";
                    return (
                      <tr key={wo.id} style={{ borderBottom: "1px solid rgba(215,195,174,0.15)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "14px 20px", fontSize: "12px", color: "#857462", fontFamily: "monospace" }}>#{wo.id}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ fontSize: "14px", color: "#191c1d", fontWeight: 600 }}>{wo.title}</div>
                          {wo.description && <div style={{ fontSize: "12px", color: "#524534", marginTop: "2px", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wo.description}</div>}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          {wo.wo_type && (
                            <span style={{ fontSize: "12px", color: CATEGORY_COLOR[wo.wo_type.category] ?? "#524534", fontWeight: 600 }}>
                              {wo.wo_type.name}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: PRIORITY_COLOR[wo.priority] ?? "#524534" }}>
                            {(PRIORITY_LABEL[wo.priority] ?? wo.priority).toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: (STATUS_COLOR[wo.status] ?? "#857462") + "22", color: STATUS_COLOR[wo.status] ?? "#857462" }}>
                            {STATUS_LABEL[wo.status] ?? wo.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: "13px", color: "#524534" }}>{wo.assigned_to || "—"}</td>
                        <td style={{ padding: "14px 20px", fontSize: "13px", color: isOverdue ? "#dc2626" : "#524534", fontWeight: isOverdue ? 600 : 400 }}>
                          {wo.due_date ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              {isOverdue && <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#dc2626" }}>warning</span>}
                              {wo.due_date}
                            </div>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <Link href={`/dashboard/work-orders/${wo.id}`}
                            style={{ fontSize: "12px", color: "#835500", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                            View <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
                          </Link>
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
    </div>
  );
}
