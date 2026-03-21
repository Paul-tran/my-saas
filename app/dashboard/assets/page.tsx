"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import Sidebar from "../../components/Sidebar";
import ErrorBanner from "../../components/ErrorBanner";
import { useAssets } from "../../../lib/hooks/useAssets";
import { Site, fetchSites } from "../../../lib/models/geography";

const STATUS_COLOR: Record<string, string> = {
  active: "#22c55e",
  inactive: "#ef4444",
  maintenance: "#f59e0b",
};

const COMMISSIONING_COLOR: Record<string, string> = {
  not_started: "#6b7280",
  in_progress: "#3b82f6",
  completed: "#22c55e",
  failed: "#ef4444",
};

export default function Assets() {
  const { assets, filters, loading, error, hasMore, updateFilters, nextPage, prevPage, handleDelete } = useAssets();
  const { getToken } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    getToken().then((t) => { if (t) fetchSites(t).then(setSites).catch(() => {}); });
  }, [getToken]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="assets" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#fff", margin: "0 0 16px" }}>Assets</h1>

          {/* Filters bar */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Search */}
            <input
              value={filters.search ?? ""}
              onChange={(e) => updateFilters({ search: e.target.value || undefined })}
              placeholder="Search tag or name..."
              style={{ background: "#111", border: "1px solid #222", color: "#ccc", borderRadius: "6px", padding: "7px 12px", fontSize: "13px", width: "200px" }}
            />

            {/* Site filter */}
            <select
              value={filters.site_id ?? ""}
              onChange={(e) => updateFilters({ site_id: e.target.value ? Number(e.target.value) : undefined })}
              style={selectStyle}
            >
              <option value="">All Sites</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {/* Status filter */}
            <select
              value={filters.status ?? ""}
              onChange={(e) => updateFilters({ status: e.target.value || undefined })}
              style={selectStyle}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>

            {/* Commissioning filter */}
            <select
              value={filters.commissioning_status ?? ""}
              onChange={(e) => updateFilters({ commissioning_status: e.target.value || undefined })}
              style={selectStyle}
            >
              <option value="">All Commissioning</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            {/* Root-only toggle */}
            <button
              onClick={() => updateFilters({ parent_id: filters.parent_id === 0 ? undefined : 0 })}
              style={{
                background: filters.parent_id === 0 ? "#f5a62322" : "#111",
                border: `1px solid ${filters.parent_id === 0 ? "#f5a623" : "#222"}`,
                color: filters.parent_id === 0 ? "#f5a623" : "#666",
                borderRadius: "6px", padding: "7px 12px", fontSize: "13px", cursor: "pointer",
              }}
            >
              Top-level only
            </button>

            {/* Clear filters */}
            {(filters.search || filters.site_id || filters.status || filters.commissioning_status || filters.parent_id !== undefined) && (
              <button
                onClick={() => updateFilters({ search: undefined, site_id: undefined, status: undefined, commissioning_status: undefined, parent_id: undefined })}
                style={{ background: "none", border: "none", color: "#555", fontSize: "13px", cursor: "pointer" }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px 40px" }}>
          {error && <ErrorBanner message={error} />}
          {loading && <p style={{ color: "#555" }}>Loading...</p>}

          {!loading && assets.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px", color: "#333" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏗️</div>
              <p style={{ fontSize: "16px", color: "#555", marginBottom: "4px", fontWeight: 600 }}>No assets found</p>
              <p style={{ fontSize: "13px", color: "#444", marginBottom: "20px" }}>
                {filters.search || filters.status || filters.site_id ? "Try adjusting your filters." : "Open a drawing, run AI analysis, and confirm detected pins to register assets."}
              </p>
              <Link href="/dashboard/documents"
                style={{ background: "#f5a623", color: "#000", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                Go to Documents
              </Link>
            </div>
          )}

          {!loading && assets.length > 0 && (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                    {["Tag", "Name", "Type", "Parent", "Children", "Commissioning", "Status", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: "11px", color: "#444", fontWeight: 600, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} style={{ borderBottom: "1px solid #111" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#0d0d0d")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "12px 12px" }}>
                        <Link href={`/dashboard/assets/${asset.id}`}
                          style={{ color: "#f5a623", fontSize: "13px", fontWeight: 700, fontFamily: "monospace", textDecoration: "none" }}>
                          {asset.tag}
                        </Link>
                      </td>
                      <td style={{ padding: "12px 12px", fontSize: "14px", color: "#ccc", fontWeight: 500 }}>{asset.name || "—"}</td>
                      <td style={{ padding: "12px 12px", fontSize: "13px", color: "#666" }}>{asset.type || "—"}</td>
                      <td style={{ padding: "12px 12px", fontSize: "13px", color: "#666" }}>
                        {asset.parent_id ? (
                          <Link href={`/dashboard/assets/${asset.parent_id}`}
                            style={{ color: "#3b82f6", textDecoration: "none", fontSize: "12px", fontFamily: "monospace" }}>
                            ↑ parent
                          </Link>
                        ) : <span style={{ color: "#333" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 12px", fontSize: "13px", color: "#666" }}>
                        {asset.children_count > 0 ? (
                          <Link href={`/dashboard/assets/${asset.id}`}
                            style={{ color: "#22c55e", textDecoration: "none", fontSize: "12px" }}>
                            {asset.children_count} child{asset.children_count !== 1 ? "ren" : ""}
                          </Link>
                        ) : <span style={{ color: "#333" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{
                          fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "20px",
                          background: (COMMISSIONING_COLOR[asset.commissioning_status] ?? "#6b7280") + "22",
                          color: COMMISSIONING_COLOR[asset.commissioning_status] ?? "#6b7280",
                          border: `1px solid ${(COMMISSIONING_COLOR[asset.commissioning_status] ?? "#6b7280")}44`,
                          textTransform: "capitalize",
                        }}>
                          {asset.commissioning_status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{
                          fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "20px",
                          background: (STATUS_COLOR[asset.status] ?? "#6b7280") + "22",
                          color: STATUS_COLOR[asset.status] ?? "#6b7280",
                          border: `1px solid ${(STATUS_COLOR[asset.status] ?? "#6b7280")}44`,
                          textTransform: "capitalize",
                        }}>
                          {asset.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <button
                          onClick={() => { if (confirm(`Delete "${asset.tag}"?`)) handleDelete(asset.id); }}
                          style={{ background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #1a1a1a" }}>
                <span style={{ fontSize: "13px", color: "#555" }}>
                  Page {filters.page ?? 1} · {assets.length} assets shown
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={prevPage}
                    disabled={(filters.page ?? 1) <= 1}
                    style={{ ...paginationBtnStyle, opacity: (filters.page ?? 1) <= 1 ? 0.3 : 1 }}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={nextPage}
                    disabled={!hasMore}
                    style={{ ...paginationBtnStyle, opacity: !hasMore ? 0.3 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: "#111", border: "1px solid #222", color: "#ccc",
  borderRadius: "6px", padding: "7px 12px", fontSize: "13px",
};

const paginationBtnStyle: React.CSSProperties = {
  background: "#111", border: "1px solid #222", color: "#ccc",
  borderRadius: "6px", padding: "6px 14px", fontSize: "13px", cursor: "pointer",
};
