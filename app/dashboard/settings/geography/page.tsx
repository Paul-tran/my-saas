"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import ErrorBanner from "../../../components/ErrorBanner";
import { useGeography } from "../../../../lib/hooks/useGeography";
import { Site, Location, GeoUnit, Partition } from "../../../../lib/models/geography";

// ─── Inline add form ─────────────────────────────────────────────────────────

function AddForm({
  placeholder,
  codePlaceholder,
  onSave,
  onCancel,
  showAddress,
}: {
  placeholder: string;
  codePlaceholder?: string;
  onSave: (name: string, code: string, extra?: string) => Promise<void>;
  onCancel: () => void;
  showAddress?: boolean;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), code.trim(), showAddress ? address.trim() || undefined : undefined);
      setName(""); setCode(""); setAddress("");
      onCancel();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "8px" }}>
      <input
        required autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
      {codePlaceholder && (
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={codePlaceholder}
          style={{ ...inputStyle, width: "120px" }}
        />
      )}
      {showAddress && (
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address (optional)"
          style={{ ...inputStyle, width: "200px" }}
        />
      )}
      <button type="submit" disabled={saving || !name.trim()} style={btnPrimaryStyle}>
        {saving ? "Saving..." : "Add"}
      </button>
      <button type="button" onClick={onCancel} style={btnGhostStyle}>
        Cancel
      </button>
    </form>
  );
}

// ─── Tree row ─────────────────────────────────────────────────────────────────

function TreeRow({
  label,
  code,
  depth,
  expanded,
  childCount,
  onToggle,
  onDelete,
  typeLabel,
}: {
  label: string;
  code?: string | null;
  depth: number;
  expanded: boolean;
  childCount?: number;
  onToggle: () => void;
  onDelete: () => void;
  typeLabel: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        paddingLeft: `${12 + depth * 20}px`,
        borderRadius: "6px",
        cursor: "pointer",
        background: "transparent",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      onClick={onToggle}
    >
      <span style={{ color: "#857462", fontSize: "12px", width: "14px", flexShrink: 0 }}>
        {childCount !== undefined ? (expanded ? "▼" : "▶") : "·"}
      </span>
      <span style={{ fontSize: "14px", color: "#191c1d", fontWeight: 500, flex: 1 }}>
        {label}
        {code && (
          <span style={{ marginLeft: "8px", fontSize: "11px", color: "#857462", fontFamily: "monospace" }}>
            {code}
          </span>
        )}
      </span>
      <span style={{ fontSize: "11px", color: "#857462", marginRight: "8px" }}>{typeLabel}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{ background: "none", border: "none", color: "#d7c3ae", fontSize: "12px", cursor: "pointer", padding: "2px 6px", borderRadius: "4px" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#d7c3ae")}
        title={`Delete ${typeLabel}`}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GeographyPage() {
  const {
    sites, locations, units, partitions,
    loading, error,
    loadLocations, loadUnits, loadPartitions,
    handleCreateSite, handleDeleteSite,
    handleCreateLocation, handleDeleteLocation,
    handleCreateUnit, handleDeleteUnit,
    handleCreatePartition, handleDeletePartition,
  } = useGeography();

  // Expansion state
  const [expandedSites, setExpandedSites] = useState<Set<number>>(new Set());
  const [expandedLocations, setExpandedLocations] = useState<Set<number>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());

  // "Adding" state — which parent is showing the add form
  const [addingUnder, setAddingUnder] = useState<string | null>(null);
  const [showAddSite, setShowAddSite] = useState(false);

  function toggleSite(id: number) {
    setExpandedSites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else { next.add(id); loadLocations(id); }
      return next;
    });
  }

  function toggleLocation(id: number) {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else { next.add(id); loadUnits(id); }
      return next;
    });
  }

  function toggleUnit(id: number) {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else { next.add(id); loadPartitions(id); }
      return next;
    });
  }

  return (
    <main style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(215,195,174,0.2)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.3em", display: "block", marginBottom: "4px" }}>Admin Settings</span>
              <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "32px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em" }}>Geography</h1>
              <p style={{ color: "#524534", fontSize: "13px", margin: "4px 0 0" }}>
                Define your project's geography hierarchy: Sites → Locations → Units → Partitions
              </p>
            </div>
            <button
              onClick={() => setShowAddSite((v) => !v)}
              style={{ background: "linear-gradient(135deg, #835500, #f5a623)", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}
            >
              + Add Site
            </button>
          </div>

          {/* Hierarchy legend */}
          <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
            {[
              { label: "Site", desc: "Top-level location", color: "#835500" },
              { label: "Location", desc: "Building / floor / zone", color: "#1d4ed8" },
              { label: "Unit", desc: "Room / section", color: "#15803d" },
              { label: "Partition", desc: "Sub-area", color: "#7c3aed" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color, display: "inline-block" }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: l.color }}>{l.label}</span>
                <span style={{ fontSize: "12px", color: "#524534" }}>{l.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 40px" }}>
          {error && <ErrorBanner message={error} />}
          {loading && <p style={{ color: "#857462" }}>Loading...</p>}

          {!loading && (
            <div style={{ maxWidth: "800px" }}>
              {/* Add site form */}
              {showAddSite && (
                <div style={{ background: "#fff", border: "1px solid rgba(215,195,174,0.3)", borderRadius: "10px", padding: "16px 20px", marginBottom: "16px", boxShadow: "0 4px 12px rgba(25,28,29,0.06)" }}>
                  <p style={{ color: "#835500", fontSize: "12px", fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>New Site</p>
                  <AddForm
                    placeholder="Site name"
                    codePlaceholder="Code (e.g. S01)"
                    showAddress
                    onSave={async (name, code, address) => {
                      await handleCreateSite(name, code, address);
                    }}
                    onCancel={() => setShowAddSite(false)}
                  />
                </div>
              )}

              {/* Empty state */}
              {sites.length === 0 && !showAddSite && (
                <div style={{ textAlign: "center", padding: "80px", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#d7c3ae", display: "block", marginBottom: "16px" }}>location_on</span>
                  <p style={{ fontSize: "16px", color: "#191c1d", marginBottom: "6px", fontWeight: 700, fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}>No sites yet</p>
                  <p style={{ fontSize: "13px", color: "#524534" }}>Add your first site to start building your geography hierarchy.</p>
                </div>
              )}

              {/* Site tree */}
              {sites.map((site) => {
                const siteExpanded = expandedSites.has(site.id);
                const siteLocs = locations[site.id] ?? [];

                return (
                  <div key={site.id} style={{ background: "#fff", border: "1px solid rgba(215,195,174,0.2)", borderRadius: "10px", marginBottom: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(25,28,29,0.05)" }}>
                    {/* Site row */}
                    <div style={{ borderLeft: "3px solid #835500" }}>
                      <TreeRow
                        label={site.name}
                        code={site.code}
                        depth={0}
                        expanded={siteExpanded}
                        childCount={siteLocs.length}
                        onToggle={() => toggleSite(site.id)}
                        onDelete={() => { if (confirm(`Delete site "${site.name}"?`)) handleDeleteSite(site.id); }}
                        typeLabel="Site"
                      />
                      {site.address && (
                        <p style={{ margin: "0 0 8px 46px", fontSize: "12px", color: "#857462" }}>{site.address}</p>
                      )}
                    </div>

                    {/* Locations */}
                    {siteExpanded && (
                      <div style={{ borderTop: "1px solid rgba(215,195,174,0.15)", background: "#f8f9fa" }}>
                        {siteLocs.map((loc) => {
                          const locExpanded = expandedLocations.has(loc.id);
                          const locUnits = units[loc.id] ?? [];

                          return (
                            <div key={loc.id}>
                              <div style={{ borderLeft: "3px solid #3b82f6", marginLeft: "20px" }}>
                                <TreeRow
                                  label={loc.name}
                                  code={loc.code}
                                  depth={1}
                                  expanded={locExpanded}
                                  childCount={locUnits.length}
                                  onToggle={() => toggleLocation(loc.id)}
                                  onDelete={() => { if (confirm(`Delete location "${loc.name}"?`)) handleDeleteLocation(loc.id, site.id); }}
                                  typeLabel="Location"
                                />
                              </div>

                              {/* Units */}
                              {locExpanded && (
                                <div style={{ background: "#f3f4f5", marginLeft: "40px" }}>
                                  {locUnits.map((unit) => {
                                    const unitExpanded = expandedUnits.has(unit.id);
                                    const unitParts = partitions[unit.id] ?? [];

                                    return (
                                      <div key={unit.id}>
                                        <div style={{ borderLeft: "3px solid #22c55e", marginLeft: "20px" }}>
                                          <TreeRow
                                            label={unit.name}
                                            code={unit.code}
                                            depth={2}
                                            expanded={unitExpanded}
                                            childCount={unitParts.length}
                                            onToggle={() => toggleUnit(unit.id)}
                                            onDelete={() => { if (confirm(`Delete unit "${unit.name}"?`)) handleDeleteUnit(unit.id, loc.id); }}
                                            typeLabel="Unit"
                                          />
                                        </div>

                                        {/* Partitions */}
                                        {unitExpanded && (
                                          <div style={{ marginLeft: "60px" }}>
                                            {unitParts.map((part) => (
                                              <div key={part.id} style={{ borderLeft: "3px solid #a855f7", marginLeft: "20px" }}>
                                                <TreeRow
                                                  label={part.name}
                                                  code={part.code}
                                                  depth={3}
                                                  expanded={false}
                                                  onToggle={() => {}}
                                                  onDelete={() => { if (confirm(`Delete partition "${part.name}"?`)) handleDeletePartition(part.id, unit.id); }}
                                                  typeLabel="Partition"
                                                />
                                              </div>
                                            ))}

                                            {/* Add partition form */}
                                            {addingUnder === `partition:${unit.id}` ? (
                                              <div style={{ padding: "8px 12px 12px 32px" }}>
                                                <AddForm
                                                  placeholder="Partition name"
                                                  codePlaceholder="Code"
                                                  onSave={async (name, code) => handleCreatePartition(unit.id, name, code || undefined)}
                                                  onCancel={() => setAddingUnder(null)}
                                                />
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => setAddingUnder(`partition:${unit.id}`)}
                                                style={addChildBtnStyle(32)}
                                              >
                                                + Add Partition
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* Add unit form */}
                                  {addingUnder === `unit:${loc.id}` ? (
                                    <div style={{ padding: "8px 12px 12px 40px" }}>
                                      <AddForm
                                        placeholder="Unit name"
                                        codePlaceholder="Code"
                                        onSave={async (name, code) => handleCreateUnit(loc.id, name, code || undefined)}
                                        onCancel={() => setAddingUnder(null)}
                                      />
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setAddingUnder(`unit:${loc.id}`)}
                                      style={addChildBtnStyle(40)}
                                    >
                                      + Add Unit
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add location form */}
                        {addingUnder === `loc:${site.id}` ? (
                          <div style={{ padding: "8px 12px 12px 20px" }}>
                            <AddForm
                              placeholder="Location name"
                              codePlaceholder="Code"
                              onSave={async (name, code) => handleCreateLocation(site.id, name, code || undefined)}
                              onCancel={() => setAddingUnder(null)}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingUnder(`loc:${site.id}`)}
                            style={addChildBtnStyle(20)}
                          >
                            + Add Location
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </main>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "#f3f4f5",
  border: "none",
  color: "#191c1d",
  borderRadius: "6px",
  padding: "7px 10px",
  fontSize: "13px",
  width: "180px",
  outline: "none",
  fontFamily: "var(--font-inter, Inter, sans-serif)",
};

const btnPrimaryStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #835500, #f5a623)",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "7px 14px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const btnGhostStyle: React.CSSProperties = {
  background: "none",
  color: "#857462",
  border: "1px solid rgba(215,195,174,0.4)",
  borderRadius: "6px",
  padding: "7px 12px",
  fontSize: "13px",
  cursor: "pointer",
};

function addChildBtnStyle(paddingLeft: number): React.CSSProperties {
  return {
    display: "block",
    background: "none",
    border: "none",
    color: "#857462",
    fontSize: "12px",
    cursor: "pointer",
    padding: `6px 12px 8px ${paddingLeft}px`,
    textAlign: "left",
    width: "100%",
    fontFamily: "var(--font-inter, Inter, sans-serif)",
  };
}
