"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import Sidebar from "../../components/Sidebar";
import ErrorBanner from "../../components/ErrorBanner";
import { useAssets } from "../../../lib/hooks/useAssets";
import { Site, fetchSites } from "../../../lib/models/geography";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:      { bg: "#dcfce7", color: "#15803d" },
  inactive:    { bg: "#fee2e2", color: "#dc2626" },
  maintenance: { bg: "#fef9c3", color: "#a16207" },
};

const COMMISSIONING_STYLE: Record<string, { bg: string; color: string }> = {
  not_started: { bg: "#f3f4f5", color: "#524534" },
  in_progress: { bg: "#dbeafe", color: "#1d4ed8" },
  completed:   { bg: "#dcfce7", color: "#15803d" },
  failed:      { bg: "#fee2e2", color: "#dc2626" },
};

const inputStyle: React.CSSProperties = {
  background: "#f3f4f5", border: "none", color: "#191c1d",
  borderRadius: "8px", padding: "8px 14px", fontSize: "13px",
  outline: "none", fontFamily: "var(--font-inter, Inter, sans-serif)",
};

export default function Assets() {
  const { assets, filters, loading, error, hasMore, updateFilters, nextPage, prevPage, handleDelete } = useAssets();
  const { getToken } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    getToken().then((t) => { if (t) fetchSites(t).then(setSites).catch(() => {}); });
  }, [getToken]);

  const hasFilters = filters.search || filters.site_id || filters.status || filters.commissioning_status || filters.parent_id !== undefined;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8f9fa", fontFamily: "var(--font-inter, Inter, sans-serif)", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <Sidebar active="assets" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(215,195,174,0.2)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.3em", display: "block", marginBottom: "4px" }}>
                Asset Registry
              </span>
              <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "32px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em" }}>
                Assets
              </h1>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f3f4f5", borderRadius: "8px", padding: "8px 14px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#857462" }}>search</span>
              <input
                value={filters.search ?? ""}
                onChange={(e) => updateFilters({ search: e.target.value || undefined })}
                placeholder="Search tag or name..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px", color: "#191c1d", width: "180px", fontFamily: "inherit" }}
              />
            </div>

            <select value={filters.site_id ?? ""} onChange={(e) => updateFilters({ site_id: e.target.value ? Number(e.target.value) : undefined })} style={inputStyle}>
              <option value="">All Sites</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select value={filters.status ?? ""} onChange={(e) => updateFilters({ status: e.target.value || undefined })} style={inputStyle}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <select value={filters.commissioning_status ?? ""} onChange={(e) => updateFilters({ commissioning_status: e.target.value || undefined })} style={inputStyle}>
              <option value="">All Commissioning</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            <button
              onClick={() => updateFilters({ parent_id: filters.parent_id === 0 ? undefined : 0 })}
              style={{
                background: filters.parent_id === 0 ? "#f5a623" : "#f3f4f5",
                border: "none", color: filters.parent_id === 0 ? "#fff" : "#524534",
                borderRadius: "8px", padding: "8px 14px", fontSize: "13px", cursor: "pointer", fontWeight: filters.parent_id === 0 ? 600 : 400,
              }}
            >
              Top-level only
            </button>

            {hasFilters && (
              <button
                onClick={() => updateFilters({ search: undefined, site_id: undefined, status: undefined, commissioning_status: undefined, parent_id: undefined })}
                style={{ background: "none", border: "none", color: "#857462", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 40px" }}>
          {error && <ErrorBanner message={error} />}

          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
              <p style={{ color: "#857462", fontSize: "14px" }}>Loading assets...</p>
            </div>
          )}

          {!loading && assets.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#d7c3ae", display: "block", marginBottom: "16px" }}>construction</span>
              <p style={{ fontSize: "16px", color: "#191c1d", marginBottom: "6px", fontWeight: 700, fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}>No assets found</p>
              <p style={{ fontSize: "13px", color: "#524534", marginBottom: "24px" }}>
                {hasFilters ? "Try adjusting your filters." : "Open a drawing, run AI analysis, and confirm detected pins to register assets."}
              </p>
              <Link href="/dashboard/documents" style={{ background: "linear-gradient(135deg, #835500, #f5a623)", color: "#fff", borderRadius: "8px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                Go to Documents
              </Link>
            </div>
          )}

          {!loading && assets.length > 0 && (
            <div style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f5" }}>
                    {["Tag", "Name", "Type", "Parent", "Children", "Commissioning", "Status", ""].map((h) => (
                      <th key={h} style={{ padding: "12px 20px", fontSize: "10px", color: "#524534", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} style={{ borderBottom: "1px solid rgba(215,195,174,0.15)", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "14px 20px" }}>
                        <Link href={`/dashboard/assets/${asset.id}`}
                          style={{ color: "#835500", fontSize: "13px", fontWeight: 700, fontFamily: "monospace", textDecoration: "none" }}>
                          {asset.tag}
                        </Link>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "14px", color: "#191c1d", fontWeight: 500 }}>{asset.name || "—"}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#524534" }}>{asset.type || "—"}</td>
                      <td style={{ padding: "14px 20px" }}>
                        {asset.parent_id ? (
                          <Link href={`/dashboard/assets/${asset.parent_id}`}
                            style={{ color: "#00658a", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_upward</span> parent
                          </Link>
                        ) : <span style={{ color: "#d7c3ae" }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {asset.children_count > 0 ? (
                          <Link href={`/dashboard/assets/${asset.id}`}
                            style={{ color: "#15803d", textDecoration: "none", fontSize: "12px", fontWeight: 600 }}>
                            {asset.children_count} child{asset.children_count !== 1 ? "ren" : ""}
                          </Link>
                        ) : <span style={{ color: "#d7c3ae" }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {(() => { const s = COMMISSIONING_STYLE[asset.commissioning_status] ?? { bg: "#f3f4f5", color: "#524534" }; return (
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: s.bg, color: s.color, textTransform: "capitalize" }}>
                            {asset.commissioning_status.replace("_", " ")}
                          </span>
                        ); })()}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {(() => { const s = STATUS_STYLE[asset.status] ?? { bg: "#f3f4f5", color: "#524534" }; return (
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: s.bg, color: s.color, textTransform: "capitalize" }}>
                            {asset.status}
                          </span>
                        ); })()}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <button
                          onClick={() => { if (confirm(`Delete "${asset.tag}"?`)) handleDelete(asset.id); }}
                          style={{ background: "none", border: "none", color: "#d7c3ae", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#d7c3ae")}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#f3f4f5" }}>
                <span style={{ fontSize: "12px", color: "#524534" }}>
                  Page {filters.page ?? 1} · {assets.length} assets shown
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={prevPage} disabled={(filters.page ?? 1) <= 1}
                    style={{ background: "#fff", border: "none", color: "#524534", borderRadius: "6px", padding: "6px 16px", fontSize: "13px", cursor: "pointer", fontWeight: 500, opacity: (filters.page ?? 1) <= 1 ? 0.4 : 1, boxShadow: "0 1px 4px rgba(25,28,29,0.08)" }}>
                    ← Prev
                  </button>
                  <button onClick={nextPage} disabled={!hasMore}
                    style={{ background: "#fff", border: "none", color: "#524534", borderRadius: "6px", padding: "6px 16px", fontSize: "13px", cursor: "pointer", fontWeight: 500, opacity: !hasMore ? 0.4 : 1, boxShadow: "0 1px 4px rgba(25,28,29,0.08)" }}>
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
