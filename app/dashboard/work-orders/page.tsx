"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ErrorBanner from "../../components/ErrorBanner";
import { useWorkOrders } from "../../../lib/hooks/useWorkOrders";
import { WorkOrder, PRIORITY_COLOR, PRIORITY_LABEL, STATUS_COLOR, STATUS_LABEL } from "../../../lib/models/workorders";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "../../../lib/models/wotypes";

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "on_hold", label: "On Hold" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function WorkOrdersPage() {
  const { workOrders, loading, error } = useWorkOrders();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const filtered = workOrders
    .filter((w) => filterStatus === "all" || w.status === filterStatus)
    .filter((w) => filterPriority === "all" || w.priority === filterPriority);

  const counts = {
    open: workOrders.filter((w) => w.status === "open").length,
    in_progress: workOrders.filter((w) => w.status === "in_progress").length,
    on_hold: workOrders.filter((w) => w.status === "on_hold").length,
    completed: workOrders.filter((w) => w.status === "completed").length,
  };

  const overdue = workOrders.filter((w) =>
    w.due_date && new Date(w.due_date) < new Date() && w.status !== "completed" && w.status !== "cancelled"
  ).length;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="work-orders" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#fff", margin: 0 }}>Work Orders</h1>
              <p style={{ color: "#555", fontSize: "14px", marginTop: "4px" }}>Manage and track all maintenance and operational tasks</p>
            </div>
            <Link href="/dashboard/work-orders/new"
              style={{ background: "#f5a623", color: "#000", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
              + New Work Order
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "16px" }}>
            {[
              { label: "Open", count: counts.open, color: "#3b82f6" },
              { label: "In Progress", count: counts.in_progress, color: "#f59e0b" },
              { label: "On Hold", count: counts.on_hold, color: "#6b7280" },
              { label: "Completed", count: counts.completed, color: "#22c55e" },
              { label: "Overdue", count: overdue, color: "#ef4444" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#111", borderRadius: "8px", padding: "14px 20px", border: "1px solid #1a1a1a", minWidth: "100px" }}>
                <div style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters + table */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 40px" }}>
          {error && <ErrorBanner message={error} />}

          {/* Filter bar */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {STATUS_FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilterStatus(f.key)}
                  style={{
                    padding: "5px 12px", borderRadius: "20px", border: "1px solid",
                    borderColor: filterStatus === f.key ? "#f5a623" : "#222",
                    background: filterStatus === f.key ? "#f5a6231a" : "transparent",
                    color: filterStatus === f.key ? "#f5a623" : "#555",
                    fontSize: "12px", fontWeight: 500, cursor: "pointer",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
            <select
              value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
              style={{ marginLeft: "auto", background: "#111", border: "1px solid #222", color: "#888", borderRadius: "6px", padding: "5px 10px", fontSize: "12px" }}>
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {loading && <p style={{ color: "#555" }}>Loading...</p>}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px", color: "#333" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔧</div>
              <p style={{ fontSize: "14px", marginBottom: "16px" }}>
                {workOrders.length === 0 ? "No work orders yet." : "No work orders match your filters."}
              </p>
              {workOrders.length === 0 && (
                <Link href="/dashboard/work-orders/new"
                  style={{ background: "#f5a623", color: "#000", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                  Create your first work order
                </Link>
              )}
            </div>
          )}

          {/* Table */}
          {filtered.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                  {["WO #", "Title", "Type", "Priority", "Status", "Assigned To", "Due Date", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", fontSize: "11px", color: "#444", fontWeight: 600, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((wo) => {
                  const isOverdue = wo.due_date && new Date(wo.due_date) < new Date() && wo.status !== "completed" && wo.status !== "cancelled";
                  return (
                    <tr key={wo.id} style={{ borderBottom: "1px solid #111", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#0d0d0d")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "14px 12px", fontSize: "12px", color: "#555" }}>#{wo.id}</td>
                      <td style={{ padding: "14px 12px" }}>
                        <div style={{ fontSize: "14px", color: "#fff", fontWeight: 500 }}>{wo.title}</div>
                        {wo.description && <div style={{ fontSize: "12px", color: "#444", marginTop: "2px", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wo.description}</div>}
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        {wo.wo_type && (
                          <span style={{ fontSize: "12px", color: CATEGORY_COLOR[wo.wo_type.category], fontWeight: 500 }}>
                            {wo.wo_type.name}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: PRIORITY_COLOR[wo.priority] }}>
                          {PRIORITY_LABEL[wo.priority].toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", background: STATUS_COLOR[wo.status] + "22", color: STATUS_COLOR[wo.status], border: `1px solid ${STATUS_COLOR[wo.status]}44` }}>
                          {STATUS_LABEL[wo.status]}
                        </span>
                      </td>
                      <td style={{ padding: "14px 12px", fontSize: "13px", color: "#666" }}>{wo.assigned_to || "—"}</td>
                      <td style={{ padding: "14px 12px", fontSize: "13px", color: isOverdue ? "#ef4444" : "#666" }}>
                        {wo.due_date ? (isOverdue ? `⚠ ${wo.due_date}` : wo.due_date) : "—"}
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <Link href={`/dashboard/work-orders/${wo.id}`}
                          style={{ fontSize: "12px", color: "#f5a623", textDecoration: "none", fontWeight: 600 }}>
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
