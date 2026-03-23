"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import {
  SystemLevelConfig, SystemDiscipline, SystemGroup, SystemSubgroup,
  fetchSystemConfig, updateSystemConfig,
  fetchDisciplines, createDiscipline, deleteDiscipline,
  fetchGroups, createGroup, deleteGroup,
  fetchSubgroups, createSubgroup, deleteSubgroup,
} from "../../../../lib/models/systems";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

const L1_COLOR = "#835500";
const L2_COLOR = "#1d4ed8";
const L3_COLOR = "#15803d";

function AddForm({
  placeholder1, placeholder2, onAdd, accent,
}: {
  placeholder1: string; placeholder2: string;
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
        style={{ flex: 2, background: "#f3f4f5", border: "none", borderRadius: "6px", padding: "7px 10px", color: "#191c1d", fontSize: "12px", outline: "none" }}
      />
      <input
        value={code} onChange={(e) => setCode(e.target.value)}
        placeholder={placeholder2}
        style={{ flex: 1, background: "#f3f4f5", border: "none", borderRadius: "6px", padding: "7px 10px", color: "#191c1d", fontSize: "12px", outline: "none" }}
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
      try {
        const [cfg, discs] = await Promise.all([
          fetchSystemConfig(PROJECT_ID, ""),
          fetchDisciplines(PROJECT_ID, ""),
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
  }, []);

  async function toggleDiscipline(d: SystemDiscipline) {
    if (expandedD.has(d.id)) {
      setExpandedD((s) => { const n = new Set(s); n.delete(d.id); return n; });
      return;
    }
    setExpandedD((s) => new Set(s).add(d.id));
    if (!groups[d.id]) {
      const gs = await fetchGroups(d.id, "").catch(() => []);
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
      const ss = await fetchSubgroups(g.id, "").catch(() => []);
      setSubgroups((prev) => ({ ...prev, [g.id]: ss }));
    }
  }

  async function handleSaveConfig() {
    const updated = await updateSystemConfig(PROJECT_ID, configDraft, "").catch(() => null);
    if (updated) { setConfig(updated); setEditingConfig(false); }
  }

  async function handleAddDiscipline(name: string, code: string) {
    const d = await createDiscipline(PROJECT_ID, { name, code }, "").catch(() => null);
    if (d) setDisciplines((prev) => [...prev, d]);
  }

  async function handleDeleteDiscipline(id: number) {
    if (!confirm("Delete this discipline and all its groups/subgroups?")) return;
    await deleteDiscipline(id, "").catch(() => {});
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
    setGroups((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setExpandedD((s) => { const n = new Set(s); n.delete(id); return n; });
  }

  async function handleAddGroup(disciplineId: number, name: string, code: string) {
    const g = await createGroup(disciplineId, { name, code }, "").catch(() => null);
    if (g) setGroups((prev) => ({ ...prev, [disciplineId]: [...(prev[disciplineId] || []), g] }));
  }

  async function handleDeleteGroup(disciplineId: number, groupId: number) {
    if (!confirm("Delete this group and all its subgroups?")) return;
    await deleteGroup(groupId, "").catch(() => {});
    setGroups((prev) => ({ ...prev, [disciplineId]: (prev[disciplineId] || []).filter((g) => g.id !== groupId) }));
    setSubgroups((prev) => { const n = { ...prev }; delete n[groupId]; return n; });
    setExpandedG((s) => { const n = new Set(s); n.delete(groupId); return n; });
  }

  async function handleAddSubgroup(groupId: number, name: string, code: string) {
    const s = await createSubgroup(groupId, { name, code }, "").catch(() => null);
    if (s) setSubgroups((prev) => ({ ...prev, [groupId]: [...(prev[groupId] || []), s] }));
  }

  async function handleDeleteSubgroup(groupId: number, subgroupId: number) {
    if (!confirm("Delete this subgroup?")) return;
    await deleteSubgroup(subgroupId, "").catch(() => {});
    setSubgroups((prev) => ({ ...prev, [groupId]: (prev[groupId] || []).filter((s) => s.id !== subgroupId) }));
  }

  const l1 = config?.level1_name ?? "Discipline";
  const l2 = config?.level2_name ?? "System";
  const l3 = config?.level3_name ?? "Subsystem";

  return (
    <main style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(215,195,174,0.2)", flexShrink: 0 }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.3em", display: "block", marginBottom: "4px" }}>Admin Settings</span>
          <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "32px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em" }}>Systems</h1>
          <p style={{ color: "#524534", fontSize: "13px", margin: "4px 0 0" }}>Define the 3-level hierarchy used to classify assets on this project.</p>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "28px 40px" }}>
          <div style={{ maxWidth: "800px" }}>

            {/* Level name config */}
            <div style={{ background: "#fff", border: "1px solid rgba(215,195,174,0.2)", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(25,28,29,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h2 style={sectionHeading}>Level Names</h2>
                {!editingConfig ? (
                  <button
                    onClick={() => setEditingConfig(true)}
                    style={{ background: "none", border: "1px solid rgba(215,195,174,0.4)", borderRadius: "6px", color: "#857462", fontSize: "12px", padding: "4px 12px", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setEditingConfig(false)} style={{ background: "none", border: "1px solid rgba(215,195,174,0.4)", borderRadius: "6px", color: "#857462", fontSize: "12px", padding: "4px 12px", cursor: "pointer" }}>Cancel</button>
                    <button onClick={handleSaveConfig} style={{ background: "linear-gradient(135deg, #835500, #f5a623)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", padding: "4px 12px", cursor: "pointer", fontWeight: 600 }}>Save</button>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                {(["level1_name", "level2_name", "level3_name"] as const).map((key, i) => {
                  const color = [L1_COLOR, L2_COLOR, L3_COLOR][i];
                  const label = `Level ${i + 1}`;
                  return (
                    <div key={key}>
                      <p style={{ fontSize: "11px", color: "#857462", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{label}</p>
                      {editingConfig ? (
                        <input
                          value={configDraft[key]}
                          onChange={(e) => setConfigDraft((d) => ({ ...d, [key]: e.target.value }))}
                          style={{ width: "100%", boxSizing: "border-box", background: "#f3f4f5", border: "none", borderBottom: `2px solid ${color}`, borderRadius: "6px", padding: "8px 10px", color: "#191c1d", fontSize: "13px", outline: "none" }}
                        />
                      ) : (
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color }}>{config ? config[key] : "—"}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "16px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(215,195,174,0.15)" }}>
                {[[L1_COLOR, l1], [L2_COLOR, l2], [L3_COLOR, l3]].map(([color, name], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "#857462" }}>L{i + 1}: {name}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
            {loading && <p style={{ color: "#857462", fontSize: "13px" }}>Loading…</p>}

            {/* Disciplines tree */}
            {!loading && (
              <div style={{ background: "#fff", border: "1px solid rgba(215,195,174,0.2)", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(25,28,29,0.05)" }}>
                <h2 style={sectionHeading}>{l1}s</h2>

                {disciplines.length === 0 && (
                  <p style={{ color: "#857462", fontSize: "13px", margin: "0 0 12px" }}>No {l1.toLowerCase()}s yet.</p>
                )}

                {disciplines.map((d) => (
                  <div key={d.id} style={{ marginBottom: "8px" }}>
                    {/* L1 row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "#f8f9fa", borderRadius: "8px", borderLeft: `3px solid ${L1_COLOR}` }}>
                      <button
                        onClick={() => toggleDiscipline(d)}
                        style={{ background: "none", border: "none", color: "#857462", fontSize: "12px", cursor: "pointer", padding: 0, width: "16px" }}
                      >
                        {expandedD.has(d.id) ? "▾" : "▸"}
                      </button>
                      <span style={{ color: L1_COLOR, fontWeight: 700, fontFamily: "monospace", fontSize: "12px" }}>{d.code}</span>
                      <span style={{ color: "#191c1d", fontSize: "13px", flex: 1 }}>{d.name}</span>
                      <button
                        onClick={() => handleDeleteDiscipline(d.id)}
                        style={{ background: "none", border: "none", color: "#d7c3ae", fontSize: "12px", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#d7c3ae")}
                      >
                        ✕
                      </button>
                    </div>

                    {/* L2 groups */}
                    {expandedD.has(d.id) && (
                      <div style={{ marginLeft: "24px", marginTop: "4px" }}>
                        {(groups[d.id] || []).map((g) => (
                          <div key={g.id} style={{ marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#f8f9fa", borderRadius: "8px", borderLeft: `3px solid ${L2_COLOR}` }}>
                              <button
                                onClick={() => toggleGroup(g)}
                                style={{ background: "none", border: "none", color: "#857462", fontSize: "12px", cursor: "pointer", padding: 0, width: "16px" }}
                              >
                                {expandedG.has(g.id) ? "▾" : "▸"}
                              </button>
                              <span style={{ color: L2_COLOR, fontWeight: 700, fontFamily: "monospace", fontSize: "12px" }}>{g.code}</span>
                              <span style={{ color: "#191c1d", fontSize: "13px", flex: 1 }}>{g.name}</span>
                              <button
                                onClick={() => handleDeleteGroup(d.id, g.id)}
                                style={{ background: "none", border: "none", color: "#d7c3ae", fontSize: "12px", cursor: "pointer" }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "#d7c3ae")}
                              >
                                ✕
                              </button>
                            </div>

                            {/* L3 subgroups */}
                            {expandedG.has(g.id) && (
                              <div style={{ marginLeft: "24px", marginTop: "4px" }}>
                                {(subgroups[g.id] || []).map((s) => (
                                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 12px", background: "#f8f9fa", borderRadius: "8px", borderLeft: `3px solid ${L3_COLOR}`, marginBottom: "4px" }}>
                                    <span style={{ color: L3_COLOR, fontWeight: 700, fontFamily: "monospace", fontSize: "12px" }}>{s.code}</span>
                                    <span style={{ color: "#191c1d", fontSize: "13px", flex: 1 }}>{s.name}</span>
                                    <button
                                      onClick={() => handleDeleteSubgroup(g.id, s.id)}
                                      style={{ background: "none", border: "none", color: "#d7c3ae", fontSize: "12px", cursor: "pointer" }}
                                      onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                                      onMouseLeave={(e) => (e.currentTarget.style.color = "#d7c3ae")}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                <AddForm
                                  placeholder1={`${l3} name`} placeholder2="Code"
                                  accent={L3_COLOR}
                                  onAdd={(name, code) => handleAddSubgroup(g.id, name, code)}
                                />
                              </div>
                            )}
                          </div>
                        ))}

                        <AddForm
                          placeholder1={`${l2} name`} placeholder2="Code"
                          accent={L2_COLOR}
                          onAdd={(name, code) => handleAddGroup(d.id, name, code)}
                        />
                      </div>
                    )}
                  </div>
                ))}

                <AddForm
                  placeholder1={`${l1} name`} placeholder2="Code"
                  accent={L1_COLOR}
                  onAdd={handleAddDiscipline}
                />
              </div>
            )}

          </div>
        </div>
    </main>
  );
}

const sectionHeading: React.CSSProperties = {
  color: "#191c1d", fontSize: "13px", fontWeight: 700,
  margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em",
};
