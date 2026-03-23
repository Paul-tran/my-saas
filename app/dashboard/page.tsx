"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDashboard } from "../../lib/hooks/useDashboard";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiFetch } from "@/lib/api";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

const kpiIcons: Record<string, string> = {
  "Total Documents": "folder_open",
  "Active Assets": "construction",
  "Open Inspections": "verified",
};

export default function Dashboard() {
  const { docCount, assetCount, inspectionCount, loading } = useDashboard();
  const { user } = useAuth();
  const [profileType, setProfileType] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.is_admin) { setProfileType("Admin"); return; }
    apiFetch<{ role: string | null }>(`/api/v1/projects/${PROJECT_ID}/members/me`)
      .then((d) => setProfileType(d.role ?? "Member"))
      .catch(() => setProfileType("Member"));
  }, [user]);

  const stats = [
    { label: "Total Documents", value: docCount, icon: "folder_open", trend: null },
    { label: "Active Assets", value: assetCount, icon: "construction", trend: null },
    { label: "Open Inspections", value: inspectionCount, icon: "verified", trend: null },
    { label: "Work Orders", value: "—", icon: "assignment", trend: null },
  ];

  const quickActions = [
    { label: "Upload Document", href: "/dashboard/documents", icon: "upload_file" },
    { label: "Add Asset", href: "/dashboard/assets", icon: "add_circle" },
    { label: "New Work Order", href: "/dashboard/work-orders/new", icon: "edit_note" },
  ];

  const activity = [
    { text: "New document uploaded", meta: "Just now • Documents", color: "#f5a623", dot: "#835500" },
    { text: "Asset inspection completed", meta: "2 hours ago • Assets", color: "#c4e7ff", dot: "#00658a" },
    { text: "Work order created", meta: "Yesterday • Work Orders", color: "#d7c3ae", dot: "#857462" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Header */}
        <header style={{
          height: "64px",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(215,195,174,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f3f4f5", borderRadius: "8px", padding: "8px 14px", width: "320px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#857462" }}>search</span>
            <input
              placeholder="Search documents, assets..."
              style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px", color: "#191c1d", width: "100%", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#857462", position: "relative" }}>
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div style={{ width: "1px", height: "24px", background: "rgba(215,195,174,0.4)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#191c1d", fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}>
                  {user?.first_name || "User"}
                </p>
                <p style={{ margin: 0, fontSize: "10px", color: "#524534" }}>{profileType ?? "—"}</p>
              </div>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #835500, #f5a623)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "12px", fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}>
                {user?.first_name?.[0] || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: "auto", padding: "40px 32px", position: "relative" }}>
          <div className="blueprint-grid" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

          {/* Page Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px", position: "relative", zIndex: 1 }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.3em", display: "block", marginBottom: "6px" }}>
                Executive Overview
              </span>
              <h2 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "36px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Project Dashboard
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "10px", color: "#524534", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Current Phase</p>
              <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#835500", fontFamily: "var(--font-manrope, Manrope, sans-serif)", letterSpacing: "-0.02em" }}>Q3 Construction</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "40px", position: "relative", zIndex: 1 }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "24px",
                borderLeft: "4px solid #835500",
                boxShadow: "0 20px 40px rgba(25,28,29,0.05)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#524534" }}>{stat.label}</p>
                  <span className="material-symbols-outlined" style={{ color: "#f5a623", fontSize: "22px" }}>{stat.icon}</span>
                </div>
                <p style={{ margin: 0, fontSize: "44px", fontWeight: 800, fontFamily: "var(--font-manrope, Manrope, sans-serif)", color: "#191c1d", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {loading ? "—" : stat.value}
                </p>
                <div style={{ marginTop: "16px", height: "4px", background: "#edeeef", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg, #835500, #f5a623)", width: "60%" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Main 2-col layout */}
          <div style={{ display: "flex", gap: "24px", position: "relative", zIndex: 1 }}>
            {/* Left: Recent Activity Table */}
            <section style={{ flex: "2", background: "#ffffff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)", overflow: "hidden" }}>
              <div style={{ padding: "24px 32px", borderBottom: "1px solid rgba(215,195,174,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", color: "#191c1d" }}>
                  Quick Navigation
                </h3>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f5" }}>
                    {["Module", "Description", "Action"].map((h) => (
                      <th key={h} style={{ padding: "12px 24px", textAlign: "left", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#524534" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { module: "Documents", desc: "Upload and manage project drawings", href: "/dashboard/documents", icon: "folder_open" },
                    { module: "Assets", desc: "Track equipment and site assets", href: "/dashboard/assets", icon: "construction" },
                    { module: "Work Orders", desc: "Manage maintenance and tasks", href: "/dashboard/work-orders", icon: "assignment" },
                    { module: "Commissioning", desc: "Track commissioning progress", href: "/dashboard/commissioning", icon: "verified" },
                    { module: "Geography", desc: "Manage sites, locations and units", href: "/dashboard/settings/geography", icon: "location_on" },
                    { module: "Systems", desc: "Define discipline and system hierarchy", href: "/dashboard/settings/systems", icon: "account_tree" },
                  ].map((row) => (
                    <tr key={row.module} style={{ borderBottom: "1px solid rgba(215,195,174,0.1)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span className="material-symbols-outlined" style={{ color: "#f5a623", fontSize: "20px" }}>{row.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: "14px", color: "#191c1d", fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}>{row.module}</span>
                        </div>
                      </td>
                      <td style={{ padding: "18px 24px", fontSize: "13px", color: "#524534" }}>{row.desc}</td>
                      <td style={{ padding: "18px 24px" }}>
                        <Link href={row.href} style={{ color: "#835500", fontSize: "12px", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                          Open <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Right: Quick Actions + Activity */}
            <aside style={{ flex: "1", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Quick Actions */}
              <div style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)" }}>
                <h3 style={{ margin: "0 0 20px", fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", color: "#191c1d" }}>
                  Quick Actions
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {quickActions.map((a) => (
                    <Link key={a.label} href={a.href} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      background: "#f3f4f5",
                      borderRadius: "8px",
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(131,85,0,0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span className="material-symbols-outlined" style={{ color: "#835500", fontSize: "20px" }}>{a.icon}</span>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#191c1d" }}>{a.label}</span>
                      </div>
                      <span className="material-symbols-outlined" style={{ color: "#857462", fontSize: "18px" }}>chevron_right</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Activity Feed */}
              <div style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)", flex: 1 }}>
                <h3 style={{ margin: "0 0 20px", fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", color: "#191c1d" }}>
                  Activity Feed
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {activity.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", paddingLeft: "16px", borderLeft: `2px solid ${item.color}`, position: "relative" }}>
                      <div style={{ position: "absolute", left: "-5px", top: "4px", width: "8px", height: "8px", borderRadius: "50%", background: item.dot }} />
                      <div>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#191c1d", lineHeight: 1.4 }}>{item.text}</p>
                        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#524534" }}>{item.meta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </main>
    </div>
  );
}
