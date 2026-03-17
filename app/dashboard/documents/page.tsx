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
};

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  async function fetchDocuments() {
    const { data, error } = await getSupabase().from("documents").select("*");
    if (!error && data) setDocuments(data);
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
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
    await getSupabase().from("documents").insert({ name: file.name, url: urlData.publicUrl, uploaded_at: new Date().toISOString() });
    await fetchDocuments();
    setUploading(false);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="documents" />

      <main style={{ flex: 1, padding: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "48px" }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "36px", letterSpacing: "-1px", marginBottom: "8px" }}>Documents</h2>
            <p style={{ color: "#666", fontSize: "15px" }}>Manage your project documents.</p>
          </div>
          <label style={{ background: "#f5a623", color: "#000", padding: "12px 24px", borderRadius: "6px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
            {uploading ? "Uploading..." : "+ Upload Document"}
            <input type="file" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {documents.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "120px" }}>
            <p style={{ fontSize: "48px" }}>📄</p>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", margin: "16px 0 8px" }}>No documents yet</h3>
            <p style={{ color: "#666" }}>Upload your first document to get started.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid #222", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "12px 24px", borderBottom: "1px solid #222", background: "#111" }}>
              <span style={{ color: "#444", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Name</span>
              <span style={{ color: "#444", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Date</span>
            </div>
            {documents.map((doc) => (
              <div key={doc.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "16px 24px", borderBottom: "1px solid #161616", alignItems: "center" }}>
                <a href={doc.url} target="_blank" style={{ color: "#f5a623", textDecoration: "none", fontSize: "14px", fontWeight: "500" }}>{doc.name}</a>
                <span style={{ color: "#444", fontSize: "13px" }}>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}