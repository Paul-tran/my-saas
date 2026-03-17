"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { getSupabase } from "../../../lib/supabase";

type Document = {
  id: number;
  name: string;
  url: string;
  uploaded_at: string;
  category: string;
  status: string;
  version: string;
  description: string;
};

const CATEGORIES = ["All", "General", "Drawings", "Submittals", "RFIs", "Reports", "Contracts"];
const STATUSES = ["Under Review", "Approved", "Rejected", "Superseded"];
const statusColor = (s: string) => ({
  "Approved": "#4ade80",
  "Under Review": "#fbbf24",
  "Rejected": "#f87171",
  "Superseded": "#666",
}[s] || "#666");

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("General");
  const [status, setStatus] = useState("Under Review");
  const [version, setVersion] = useState("v1.0");
  const [description, setDescription] = useState("");

  async function fetchDocuments() {
    const { data, error } = await getSupabase().from("documents").select("*").order("uploaded_at", { ascending: false });
    if (!error && data) setDocuments(data);
  }

  useEffect(() => { fetchDocuments(); }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await getSupabase().storage.from("documents").upload(fileName, file);
    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = getSupabase().storage.from("documents").getPublicUrl(fileName);
    await getSupabase().from("documents").insert({
      name: file.name,
      url: urlData.publicUrl,
      uploaded_at: new Date().toISOString(),
      category,
      status,
      version,
      description,
    });
    setFile(null); setCategory("General"); setStatus("Under Review");
    setVersion("v1.0"); setDescription(""); setShowForm(false);
    await fetchDocuments();
    setUploading(false);
  }

  const filtered = documents.filter((d) => {
    const matchCategory = activeCategory === "All" || d.category === activeCategory;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const inputStyle = {
    background: "#111", border: "1px solid #333", borderRadius: "6px",
    padding: "10px 14px", fontSize: "14px", color: "#fff",
    width: "100%", boxSizing: "border-box" as const
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="documents" />

      {/* Category Sidebar */}
      <aside style={{ width: "200px", borderRight: "1px solid #222", padding: "48px 16px" }}>
        <p style={{ color: "#444", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", paddingLeft: "12px" }}>Categories</p>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            display: "block", width: "100%", textAlign: "left",
            padding: "8px 12px", borderRadius: "6px", fontSize: "14px",
            background: activeCategory === cat ? "#1a1a1a" : "transparent",
            color: activeCategory === cat ? "#f5a623" : "#666",
            fontWeight: activeCategory === cat ? "700" : "400",
            border: "none", cursor: "pointer",
            borderLeft: activeCategory === cat ? "2px solid #f5a623" : "2px solid transparent",
          }}>
            {cat}
          </button>
        ))}
      </aside>

      <main style={{ flex: 1, padding: "48px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "36px", letterSpacing: "-1px", marginBottom: "8px" }}>Documents</h2>
            <p style={{ color: "#666", fontSize: "15px" }}>{filtered.length} document{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ background: "#f5a623", color: "#000", padding: "12px 24px", borderRadius: "6px", fontSize: "14px", fontWeight: "700", border: "none", cursor: "pointer" }}>
            + Upload Document
          </button>
        </div>

        {/* Search Bar */}
        <input
          style={{ ...inputStyle, marginBottom: "24px" }}
          placeholder="🔍  Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Upload Form */}
        {showForm && (
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "32px", marginBottom: "32px" }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", marginBottom: "24px" }}>Upload Document</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", color: "#444", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>File</label>
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: "8px 14px" }} />
              </div>
              <div>
                <label style={{ display: "block", color: "#444", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Category</label>
                <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: "#444", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Status</label>
                <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: "#444", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Version</label>
                <input style={inputStyle} placeholder="v1.0" value={version} onChange={(e) => setVersion(e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", color: "#444", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Description</label>
                <input style={inputStyle} placeholder="Brief description..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <button onClick={handleUpload} disabled={uploading || !file} style={{ background: "#f5a623", color: "#000", padding: "12px 32px", borderRadius: "6px", fontSize: "14px", fontWeight: "700", border: "none", cursor: "pointer" }}>
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documents Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "120px" }}>
            <p style={{ fontSize: "48px" }}>📄</p>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", margin: "16px 0 8px" }}>No documents found</h3>
            <p style={{ color: "#666" }}>Try a different category or upload a new document.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid #222", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", padding: "12px 24px", borderBottom: "1px solid #222", background: "#111" }}>
              {["Name", "Category", "Version", "Status", "Date"].map((h) => (
                <span key={h} style={{ color: "#444", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>{h}</span>
              ))}
            </div>
            {filtered.map((doc) => (
              <div key={doc.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", padding: "16px 24px", borderBottom: "1px solid #161616", alignItems: "center", gap: "8px" }}>
                <div>
                  <a href={doc.url} target="_blank" style={{ color: "#f5a623", textDecoration: "none", fontSize: "14px", fontWeight: "500" }}>{doc.name}</a>
                  {doc.description && <p style={{ color: "#444", fontSize: "12px", marginTop: "2px" }}>{doc.description}</p>}
                </div>
                <span style={{ color: "#666", fontSize: "13px" }}>{doc.category}</span>
                <span style={{ color: "#888", fontSize: "13px", fontFamily: "monospace" }}>{doc.version}</span>
                <span style={{ color: statusColor(doc.status), fontSize: "12px", fontWeight: "700", background: statusColor(doc.status) + "22", padding: "4px 10px", borderRadius: "100px", display: "inline-block" }}>
                  {doc.status}
                </span>
                <span style={{ color: "#444", fontSize: "12px" }}>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}