"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { getSupabase } from "../../../lib/supabase";

type Asset = {
  id: number;
  name: string;
  type: string;
  status: string;
  location: string;
};

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("Active");
  const [location, setLocation] = useState("");

  async function fetchAssets() {
    const { data, error } = await getSupabase().from("assets").select("*");
    if (!error && data) setAssets(data);
  }

  useEffect(() => { fetchAssets(); }, []);

  async function handleAddAsset() {
    if (!name) return;
    await getSupabase().from("assets").insert({ name, type, status, location });
    setName(""); setType(""); setStatus("Active"); setLocation("");
    setShowForm(false);
    await fetchAssets();
  }

  const inputStyle = { background: "#111", border: "1px solid #333", borderRadius: "6px", padding: "10px 14px", fontSize: "14px", color: "#fff", width: "100%", boxSizing: "border-box" as const };
  const statusColor = (s: string) => s === "Active" ? "#4ade80" : s === "Inactive" ? "#f87171" : "#fbbf24";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="assets" />

      <main style={{ flex: 1, padding: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "48px" }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "36px", letterSpacing: "-1px", marginBottom: "8px" }}>Assets</h2>
            <p style={{ color: "#666", fontSize: "15px" }}>Track equipment and resources.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ background: "#f5a623", color: "#000", padding: "12px 24px", borderRadius: "6px", fontSize: "14px", fontWeight: "700", border: "none", cursor: "pointer" }}>
            + Add Asset
          </button>
        </div>

        {showForm && (
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "32px", maxWidth: "480px", marginBottom: "40px" }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", marginBottom: "24px" }}>New Asset</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input style={inputStyle} placeholder="Asset name" value={name} onChange={(e) => setName(e.target.value)} />
              <input style={inputStyle} placeholder="Type (e.g. Vehicle, Equipment)" value={type} onChange={(e) => setType(e.target.value)} />
              <input style={inputStyle} placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
              <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>Active</option>
                <option>Inactive</option>
                <option>Under Maintenance</option>
              </select>
              <button onClick={handleAddAsset} style={{ background: "#f5a623", color: "#000", padding: "12px", borderRadius: "6px", fontSize: "14px", fontWeight: "700", border: "none", cursor: "pointer", marginTop: "8px" }}>
                Save Asset
              </button>
            </div>
          </div>
        )}

        {assets.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "120px" }}>
            <p style={{ fontSize: "48px" }}>🏗️</p>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", margin: "16px 0 8px" }}>No assets yet</h3>
            <p style={{ color: "#666" }}>Add your first asset to get started.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid #222", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "12px 24px", borderBottom: "1px solid #222", background: "#111" }}>
              {["Name", "Type", "Location", "Status"].map((h) => (
                <span key={h} style={{ color: "#444", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>{h}</span>
              ))}
            </div>
            {assets.map((asset) => (
              <div key={asset.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "16px 24px", borderBottom: "1px solid #161616", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: "500" }}>{asset.name}</span>
                <span style={{ color: "#666", fontSize: "14px" }}>{asset.type}</span>
                <span style={{ color: "#666", fontSize: "14px" }}>{asset.location}</span>
                <span style={{ color: statusColor(asset.status), fontSize: "13px", fontWeight: "700" }}>{asset.status}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
