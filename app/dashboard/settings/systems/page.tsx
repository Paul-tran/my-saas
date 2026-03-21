"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Sidebar from "../../../components/Sidebar";
import {
  SystemLevelConfig, SystemDiscipline, SystemGroup, SystemSubgroup,
  fetchSystemConfig, updateSystemConfig,
  fetchDisciplines, createDiscipline, deleteDiscipline,
  fetchGroups, createGroup, deleteGroup,
  fetchSubgroups, createSubgroup, deleteSubgroup,
} from "../../../../lib/models/systems";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

// Colour per level
const L1_COLOR = "#f5a623";
const L2_COLOR = "#3b82f6";
const L3_COLOR = "#22c55e";

function AddForm({
  placeholder1, placeholder2, label1, label2, onAdd,
  accent,
}: {
  placeholder1: string; placeholder2: string;
  label1: string; label2: string;
  onAdd: (name: string, code: string) => Promise<void>;
  accent: string;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setSaving(true);
    await onAdd(name.trim(), code.trim());
    setName(""); setCode("");
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
      <input
        value={name} onChange={(e) => setName(e.target.value)}
        placeholder={placeholder1}
        style={{ flex: 2, background: "#0a0a0a", border: "1px solid #222", borderRadius: "6px", padding: "7px 10px", color: "#ccc", fontSize: "12px", outline: "none" }}
      />
      <input
        value={code} onChange={(e) => setCode(e.target.value)}
        placeholder={placeholder2}
        style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", borderRadius: "6px", padding: "7px 10px", color: "#ccc", fontSize: "12px", outline: "none" }}
      />
      <button
        type="submit" disabled={saving || !name.trim() || !code.trim()}
        style={{ background: accent + "22", border: `1px solid ${accent}44`, color: accent, borderRadius: "6px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
      >
        {saving ? "…" : "+ Add"}
      </button>
    </form>
  );
}

export default function SystemsPage() {
  const { getToken } = useAuth();

  const [config, setConfig] = useState<SystemLevelConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState({ level1_name: "", level2_name: "", level3_name: "" });

  const [disciplines, setDisciplines] = useState<SystemDiscipline[]>([]);
  const [expandedD, setExpandedD] = useState<Set<number>>(new Set());
  const [groups, setGroups] = useState<Record<number, SystemGroup[]>>({});
  const [expandedG, setExpandedG] = useState<Set<number>>(new Set());
  const [subgroups, setSubgroups] = useState<Record<number, SystemSubgroup[]>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) return;
      try {
        const [cfg, discs] = await Promise.all([
          fetchSystemConfig(PROJECT_ID, token),
          fetchDisciplines(PROJECT_ID, token),
        ]);
        setConfig(cfg);
        setConfigDraft({ level1_name: cfg.level1_name, level2_name: cfg.level2_name, level3_name: cfg.level3_name });
        setDisciplines(discs);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  async function toggleDiscipline(d: SystemDiscipline) {
    if (expandedD.has(d.id)) {
      setExpandedD((s) => { const n = new Set(s); n.delete(d.id); return n; });
      return;
    }
    setExpandedD((s) => new Set(s).add(d.id));
    if (!groups[d.id]) {
      const token = await getToken();
      if (!token) return;
      const gs = await fetchGroups(d.id, token).catch(() => []);
      setGroups((prev) => ({ ...prev, [d.id]: gs }));
    }
  }

  async function toggleGroup(g: SystemGroup) {
    if (expandedG.has(g.id)) {
      setExpandedG((s) => { const n = new Set(s); n.delete(g.id); return n; });
      return;
    }
    setExpandedG((s) => new Set(s).add(g.id));
    if (!subgroups[g.id]) {
      const token = await getToken();
      if (!token) return;
      const ss = await fetchSubgroups(g.id, token).catch(() => []);
      setSubgroups((prev) => ({ ...prev, [g.id]: ss }));
    }
  }

  async function handleSaveConfig() {
    const token = await getToken();
    if (!token) return;
    const updated = await updateSystemConfig(PROJECT_ID, configDraft, token).catch(() => null);
    if (updated) { setConfig(updated); setEditingConfig(false); }
  }

  async function handleAddDiscipline(name: string, code: string) {
    const token = await getToken();
    if (!token) return;
    const d = await createDiscipline(PROJECT_ID, { name, code }, token).catch(() => null);
    if (d) setDisciplines((prev) => [...prev, d]);
  }

  async function handleDeleteDiscipline(id: number) {
    if (!confirm("Delete this discipline and all its groups/subgroups?")) return;
    const token = await getToken();
    if (!token) return;
    await deleteDiscipline(id, token).catch(() => {});
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
    setGroups((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setExpandedD((s) => { const n = new Set(s); n.delete(id); return n; });
  }

  async function handleAddGroup(disciplineId: number, name: string, code: string) {
    const token = await getToken();
    if (!token) return;
    const g = await createGroup(disciplineId, { name, code }, token).catch(() => null);
    if (g) setGroups((prev) => ({ ...prev, [disciplineId]: [...(prev[disciplineId] || []), g] }));
  }

  async function handleDeleteGroup(disciplineId: number, groupId: number) {
    if (!confirm("Delete this group and all its subgroups?")) return;
    const token = await getToken();
    if (!token) return;
    await deleteGroup(groupId, token).catch(() => {});
    setGroups((prev) => ({ ...prev, [disciplineId]: (prev[disciplineId] || []).filter((g) => g.id !== groupId) }));
    setSubgroups((prev) => { const n = { ...prev }; delete n[groupId]; return n; });
    setExpandedG((s) => { const n = new Set(s); n.delete(groupId); return n; });
  }

  async function handleAddSubgroup(groupId: number, name: string, code: string) {
    const token = await getToken();
    if (!token) return;
    const s = await createSubgroup(groupId, { name, code }, token).catch(() => null);
    if (s) setSubgroups((prev) => ({ ...prev, [groupId]: [...(prev[groupId] || []), s] }));
  }

  async function handleDeleteSubgroup(groupId: number, subgroupId: number) {
    if (!confirm("Delete this subgroup?")) return;
    const token = await getToken();
    if (!token) return;
    await deleteSubgroup(subgroupId, token).catch(() => {});
    setSubgroups((prev) => ({ ...prev, [groupId]: (prev[groupId] || []).filter((s) => s.id !== subgroupId) }));
  }

  const l1 = config?.level1_name ?? "Discipline";
  const l2 = config?.level2_name ?? "System";
  const l3 = config?.level3_name ?? "Subsystem";

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="systems" />

      <main style={{ flex: 1, overflow: "auto", padding: "40px" }}>
        <div style={{ maxWidth: "800px" }}>

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#fff", margin: "0 0 6px" }}>
              Systems
            </h1>
            <p style={{ color: "#555", fontSize: "13px", margin: 0 }}>
              Define the 3-level hierarchy used to classify assets on this project.
            </p>
          </div>

          {/* Level name config */}
          <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={sectionHeading}>Level Names</h2>
              {!editingConfig ? (
                <button
                  onClick={() => setEditingConfig(true)}
                  style={{ background: "none", border: "1px solid #333", borderRadius: "6px", color: "#888", fontSize: "12px", padding: "4px 12px", cursor: "pointer" }}
                >
                  Edit
                </button>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setEditingConfig(false)} style={{ background: "none", border: "1px solid #333", borderRadius: "6px", color: "#888", fontSize: "12px", padding: "4px 12px", cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleSaveConfig} style={{ background: "#f5a62322", border: "1px solid #f5a62344", borderRadius: "6px", color: "#f5a623", fontSize: "12px", padding: "4px 12px", cursor: "pointer", fontWeight: 600 }}>Save</button>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              {(["level1_name", "level2_name", "level3_name"] as const).map((key, i) => {
                const color = [L1_COLOR, L2_COLOR, L3_COLOR][i];
                const label = `Level ${i + 1}`;
                return (
                  <div key={key}>
                    <p style={{ fontSize: "11px", color: "#444", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{label}</p>
                    {editingConfig ? (
                      <input
                        value={configDraft[key]}
                        onChange={(e) => setConfigDraft((d) => ({ ...d, [key]: e.target.value }))}
                        style={{ width: "100%", boxSizing: "border-box", background: "#0a0a0a", border: `1px solid ${color}44`, borderRadius: "6px", padding: "8px 10px", color: "#ccc", fontSize: "13px", outline: "none" }}
                      />
                    ) : (
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color }}>{config ? config[key] : "—"}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: "16px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #1a1a1a" }}>
              {[[L1_COLOR, l1], [L2_COLOR, l2], [L3_COLOR, l3]].map(([color, name], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "#555" }}>L{i + 1}: {name}</span>
                </div>
              ))}
            </div>
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: "13px" }}>{error}</p>}
          {loading && <p style={{ color: "#555", fontSize: "13px" }}>Loading…</p>}

          {/* Disciplines tree */}
          {!loading && (
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "24px" }}>
              <h2 style={sectionHeading}>{l1}s</h2>

              {disciplines.length === 0 && (
                <p style={{ color: "#444", fontSize: "13px", margin: "0 0 12px" }}>No {l1.toLowerCase()}s yet.</p>
              )}

              {disciplines.map((d) => (
                <div key={d.id} style={{ marginBottom: "8px" }}>
                  {/* L1 row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "#0d0d0d", borderRadius: "8px", borderLeft: `3px solid ${L1_COLOR}` }}>
                    <button
                      onClick={() => toggleDiscipline(d)}
                      style={{ background: "none", border: "none", color: "#888", fontSize: "12px", cursor: "pointer", padding: 0, width: "16px" }}
                    >
                      {expandedD.has(d.id) ? "▾" : "▸"}
                    </button>
                    <span style={{ color: L1_COLOR, fontWeight: 700, fontFamily: "monospace", fontSize: "12px" }}>{d.code}</span>
                    <span style={{ color: "#ccc", fontSize: "13px", flex: 1 }}>{d.name}</span>
                    <button
                      onClick={() => handleDeleteDiscipline(d.id)}
                      style={{ background: "none", border: "none", color: "#333", fontSize: "12px", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
                    >
                      ✕
                    </button>
                  </div>

                  {/* L2 groups */}
                  {expandedD.has(d.id) && (
                    <div style={{ marginLeft: "24px", marginTop: "4px" }}>
                      {(groups[d.id] || []).map((g) => (
                        <div key={g.id} style={{ marginBottom: "4px" }}>
                          {/* L2 row */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#0d0d0d", borderRadius: "8px", borderLeft: `3px solid ${L2_COLOR}` }}>
                            <button
                              onClick={() => toggleGroup(g)}
                              style={{ background: "none", border: "none", color: "#888", fontSize: "12px", cursor: "pointer", padding: 0, width: "16px" }}
                            >
                              {expandedG.has(g.id) ? "▾" : "▸"}
                            </button>
                            <span style={{ color: L2_COLOR, fontWeight: 700, fontFamily: "monospace", fontSize: "12px" }}>{g.code}</span>
                            <span style={{ color: "#ccc", fontSize: "13px", flex: 1 }}>{g.name}</span>
                            <button
                              onClick={() => handleDeleteGroup(d.id, g.id)}
                              style={{ background: "none", border: "none", color: "#333", fontSize: "12px", cursor: "pointer" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
                            >
                              ✕
                            </button>
                          </div>

                          {/* L3 subgroups */}
                          {expandedG.has(g.id) && (
                            <div style={{ marginLeft: "24px", marginTop: "4px" }}>
                              {(subgroups[g.id] || []).map((s) => (
                                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 12px", background: "#0d0d0d", borderRadius: "8px", borderLeft: `3px solid ${L3_COLOR}`, marginBottom: "4px" }}>
                                  <span style={{ color: L3_COLOR, fontWeight: 700, fontFamily: "monospace", fontSize: "12px" }}>{s.code}</span>
                                  <span style={{ color: "#ccc", fontSize: "13px", flex: 1 }}>{s.name}</span>
                                  <button
                                    onClick={() => handleDeleteSubgroup(g.id, s.id)}
                                    style={{ background: "none", border: "none", color: "#333", fontSize: "12px", cursor: "pointer" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <AddForm
                                label1="Name" label2="Code"
                                placeholder1={`${l3} name`} placeholder2="Code"
                                accent={L3_COLOR}
                                onAdd={(name, code) => handleAddSubgroup(g.id, name, code)}
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      <AddForm
                        label1="Name" label2="Code"
                        placeholder1={`${l2} name`} placeholder2="Code"
                        accent={L2_COLOR}
                        onAdd={(name, code) => handleAddGroup(d.id, name, code)}
                      />
                    </div>
                  )}
                </div>
              ))}

              <AddForm
                label1="Name" label2="Code"
                placeholder1={`${l1} name`} placeholder2="Code"
                accent={L1_COLOR}
                onAdd={handleAddDiscipline}
              />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const sectionHeading: React.CSSProperties = {
  color: "#fff", fontSize: "13px", fontWeight: 700,
  margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em",
};
