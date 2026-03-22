"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ErrorBanner from "../../components/ErrorBanner";
import { useDocuments } from "../../../lib/hooks/useDocuments";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:        { bg: "#f3f4f5", color: "#524534" },
  under_review: { bg: "#fef9c3", color: "#a16207" },
  approved:     { bg: "#dcfce7", color: "#15803d" },
  superseded:   { bg: "#fee2e2", color: "#dc2626" },
};

export default function Documents() {
  const { documents, loading, uploading, error, handleUpload, handleDelete } = useDocuments();

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8f9fa", fontFamily: "var(--font-inter, Inter, sans-serif)", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <Sidebar active="documents" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(215,195,174,0.2)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.3em", display: "block", marginBottom: "4px" }}>
                Document Control
              </span>
              <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "32px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em" }}>
                Documents
              </h1>
              <p style={{ color: "#524534", fontSize: "13px", margin: "4px 0 0" }}>Upload and manage project drawings and documents</p>
            </div>
            <label style={{
              background: "linear-gradient(135deg, #835500, #f5a623)",
              color: "#fff", borderRadius: "8px", padding: "12px 24px",
              fontSize: "13px", fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px",
              fontFamily: "var(--font-manrope, Manrope, sans-serif)", letterSpacing: "0.02em",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>upload_file</span>
              {uploading ? "Uploading..." : "Upload Document"}
              <input type="file" style={{ display: "none" }} disabled={uploading}
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} />
            </label>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 40px" }}>
          {error && <ErrorBanner message={error} />}

          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
              <p style={{ color: "#857462", fontSize: "14px" }}>Loading documents...</p>
            </div>
          )}

          {!loading && documents.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#d7c3ae", display: "block", marginBottom: "16px" }}>folder_open</span>
              <p style={{ fontSize: "16px", color: "#191c1d", marginBottom: "6px", fontWeight: 700, fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}>No documents yet</p>
              <p style={{ fontSize: "13px", color: "#524534" }}>Upload your first document to get started.</p>
            </div>
          )}

          {!loading && documents.length > 0 && (
            <div style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f5" }}>
                    {["Name", "Category", "Status", "Version", "Uploaded", ""].map((h) => (
                      <th key={h} style={{ padding: "12px 24px", fontSize: "10px", color: "#524534", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: "1px solid rgba(215,195,174,0.15)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#f5a623" }}>description</span>
                          <Link href={`/dashboard/documents/${doc.id}`}
                            style={{ color: "#191c1d", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#835500")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#191c1d")}>
                            {doc.name}
                          </Link>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "#524534" }}>{doc.category || "—"}</td>
                      <td style={{ padding: "16px 24px" }}>
                        {(() => { const s = STATUS_STYLE[doc.status] ?? { bg: "#f3f4f5", color: "#524534" }; return (
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: s.bg, color: s.color, textTransform: "capitalize" }}>
                            {doc.status.replace("_", " ")}
                          </span>
                        ); })()}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "#524534" }}>{doc.version || "—"}</td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "#857462" }}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <button onClick={() => { if (confirm(`Delete "${doc.name}"?`)) handleDelete(doc.id); }}
                          style={{ background: "none", border: "none", color: "#d7c3ae", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#d7c3ae")}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
