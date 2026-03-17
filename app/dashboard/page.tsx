"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getSupabase } from "../../lib/supabase";

export default function Dashboard() {
  const [docCount, setDocCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [inspectionCount, setInspectionCount] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      const client = getSupabase();
      const { data: docs } = await client.from("documents").select("*");
      const { data: assets } = await client.from("assets").select("*");
      const { data: inspections } = await client.from("commissioning").select("*").eq("status", "Pending");
      setDocCount(docs?.length || 0);
      setAssetCount(assets?.length || 0);
      setInspectionCount(inspections?.length || 0);
    }
    fetchStats();
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="dashboard" />

      <main style={{ flex: 1, padding: "48px" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "36px", letterSpacing: "-1px", marginBottom: "8px" }}>Welcome back</h2>
        <p style={{ color: "#666", fontSize: "15px", marginBottom: "48px" }}>Here's an overview of your project.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", background: "#222" }}>
          {[
            { label: "Total Documents", value: docCount, icon: "📄" },
            { label: "Active Assets", value: assetCount, icon: "🏗️" },
            { label: "Open Inspections", value: inspectionCount, icon: "✅" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#0a0a0a", padding: "40px" }}>
              <span style={{ fontSize: "28px" }}>{stat.icon}</span>
              <p style={{ color: "#666", fontSize: "13px", marginTop: "16px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>{stat.label}</p>
              <p style={{ fontSize: "48px", fontFamily: "'DM Serif Display', serif", lineHeight: 1 }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}