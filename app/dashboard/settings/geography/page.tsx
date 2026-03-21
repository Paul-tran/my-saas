"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Sidebar from "../../../components/Sidebar";
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
      onMouseEnter={(e) => (e.currentTarget.style.background = "#111")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      onClick={onToggle}
    >
      <span style={{ color: "#444", fontSize: "12px", width: "14px", flexShrink: 0 }}>
        {childCount !== undefined ? (expanded ? "▼" : "▶") : "·"}
      </span>
      <span style={{ fontSize: "14px", color: "#ccc", fontWeight: 500, flex: 1 }}>
        {label}
        {code && (
          <span style={{ marginLeft: "8px", fontSize: "11px", color: "#555", fontFamily: "monospace" }}>
            {code}
          </span>
        )}
      </span>
      <span style={{ fontSize: "11px", color: "#444", marginRight: "8px" }}>{typeLabel}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{ background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer", padding: "2px 6px", borderRadius: "4px" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
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
  const [addingUnder, setAddingUnder] = useState<string | null>(null); // "site", "loc:{id}", "unit:{id}", "partition:{id}"
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

  const totalCount = sites.length;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="geography" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#fff", margin: 0 }}>Locations</h1>
              <p style={{ color: "#555", fontSize: "14px", marginTop: "4px" }}>
                Define your project's geography hierarchy: Sites → Locations → Units → Partitions
              </p>
            </div>
            <button
              onClick={() => setShowAddSite((v) => !v)}
              style={{ background: "#f5a623", color: "#000", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
            >
              + Add Site
            </button>
          </div>

          {/* Hierarchy legend */}
          <div style={{ display: "flex", gap: "24px", marginTop: "20px" }}>
            {[
              { label: "Site", desc: "Top-level location", color: "#f5a623" },
              { label: "Location", desc: "Building / floor / zone", color: "#3b82f6" },
              { label: "Unit", desc: "Room / section", color: "#22c55e" },
              { label: "Partition", desc: "Sub-area", color: "#a855f7" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color, display: "inline-block" }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: l.color }}>{l.label}</span>
                <span style={{ fontSize: "12px", color: "#444" }}>{l.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 40px" }}>
          {error && <ErrorBanner message={error} />}
          {loading && <p style={{ color: "#555" }}>Loading...</p>}

          {!loading && (
            <div style={{ maxWidth: "800px" }}>
              {/* Add site form */}
              {showAddSite && (
                <div style={{ background: "#111", border: "1px solid #f5a62333", borderRadius: "10px", padding: "16px 20px", marginBottom: "16px" }}>
                  <p style={{ color: "#f5a623", fontSize: "12px", fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>New Site</p>
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
                <div style={{ textAlign: "center", padding: "80px", color: "#333" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>📍</div>
                  <p style={{ fontSize: "16px", color: "#555", marginBottom: "4px", fontWeight: 600 }}>No sites yet</p>
                  <p style={{ fontSize: "13px", color: "#444" }}>Add your first site to start building your geography hierarchy.</p>
                </div>
              )}

              {/* Site tree */}
              {sites.map((site) => {
                const siteExpanded = expandedSites.has(site.id);
                const siteLocs = locations[site.id] ?? [];

                return (
                  <div key={site.id} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "10px", marginBottom: "8px", overflow: "hidden" }}>
                    {/* Site row */}
                    <div style={{ borderLeft: "3px solid #f5a623" }}>
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
                        <p style={{ margin: "0 0 8px 46px", fontSize: "12px", color: "#444" }}>{site.address}</p>
                      )}
                    </div>

                    {/* Locations */}
                    {siteExpanded && (
                      <div style={{ borderTop: "1px solid #1a1a1a", background: "#0d0d0d" }}>
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
                                <div style={{ background: "#0a0a0a", marginLeft: "40px" }}>
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
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "#0a0a0a",
  border: "1px solid #333",
  color: "#fff",
  borderRadius: "6px",
  padding: "7px 10px",
  fontSize: "13px",
  width: "180px",
  outline: "none",
};

const btnPrimaryStyle: React.CSSProperties = {
  background: "#f5a623",
  color: "#000",
  border: "none",
  borderRadius: "6px",
  padding: "7px 14px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const btnGhostStyle: React.CSSProperties = {
  background: "none",
  color: "#555",
  border: "1px solid #333",
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
    color: "#444",
    fontSize: "12px",
    cursor: "pointer",
    padding: `6px 12px 8px ${paddingLeft}px`,
    textAlign: "left",
    width: "100%",
    fontFamily: "'DM Sans', sans-serif",
  };
}
