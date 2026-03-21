"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import ErrorBanner from "../../components/ErrorBanner";
import { useDocuments } from "../../../lib/hooks/useDocuments";

const STATUS_COLOR: Record<string, string> = {
  draft: "#6b7280",
  under_review: "#f59e0b",
  approved: "#22c55e",
  superseded: "#ef4444",
};

export default function Documents() {
  const { documents, loading, uploading, error, handleUpload, handleDelete } = useDocuments();

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="documents" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#fff", margin: 0 }}>Documents</h1>
              <p style={{ color: "#555", fontSize: "14px", marginTop: "4px" }}>Upload and manage project drawings and documents</p>
            </div>
            <label style={{ background: "#f5a623", color: "#000", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
              {uploading ? "Uploading..." : "+ Upload Document"}
              <input type="file" style={{ display: "none" }} disabled={uploading}
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} />
            </label>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 40px" }}>
          {error && <ErrorBanner message={error} />}

          {loading && <p style={{ color: "#555" }}>Loading...</p>}

          {!loading && documents.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px", color: "#333" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📄</div>
              <p style={{ fontSize: "16px", color: "#555", marginBottom: "4px", fontWeight: 600 }}>No documents yet</p>
              <p style={{ fontSize: "13px", color: "#333" }}>Upload your first document to get started.</p>
            </div>
          )}

          {!loading && documents.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                  {["Name", "Category", "Status", "Version", "Uploaded", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", fontSize: "11px", color: "#444", fontWeight: 600, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: "1px solid #111" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#0d0d0d")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "14px 12px" }}>
                      <Link href={`/dashboard/documents/${doc.id}`}
                        style={{ color: "#f5a623", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}>
                        {doc.name}
                      </Link>
                    </td>
                    <td style={{ padding: "14px 12px", fontSize: "13px", color: "#666" }}>{doc.category || "—"}</td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "20px",
                        background: (STATUS_COLOR[doc.status] ?? "#6b7280") + "22",
                        color: STATUS_COLOR[doc.status] ?? "#6b7280",
                        border: `1px solid ${STATUS_COLOR[doc.status] ?? "#6b7280"}44`,
                      }}>
                        {doc.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px", fontSize: "13px", color: "#666" }}>{doc.version || "—"}</td>
                    <td style={{ padding: "14px 12px", fontSize: "13px", color: "#555" }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <button onClick={() => { if (confirm(`Delete "${doc.name}"?`)) handleDelete(doc.id); }}
                        style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
