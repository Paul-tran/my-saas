"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import Sidebar from "../../../components/Sidebar";
import { Asset, fetchAsset, fetchAssetChildren, fetchAssets, updateAsset, AssetDrawing, fetchAssetDrawings } from "../../../../lib/models/assets";
import { Site, Location, GeoUnit, Partition, fetchSite, fetchLocation, fetchUnit, fetchPartition } from "../../../../lib/models/geography";
import {
  SystemDiscipline, SystemGroup, SystemSubgroup,
  fetchDiscipline, fetchGroup, fetchSubgroup,
  fetchDisciplines, fetchGroups, fetchSubgroups,
} from "../../../../lib/models/systems";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

const STATUS_COLOR: Record<string, string> = {
  active: "#22c55e", inactive: "#ef4444", maintenance: "#f59e0b",
};
const COMMISSIONING_COLOR: Record<string, string> = {
  not_started: "#6b7280", in_progress: "#3b82f6", completed: "#22c55e", failed: "#ef4444",
};
const DOC_STATUS_COLOR: Record<string, string> = {
  draft: "#6b7280", under_review: "#f59e0b", approved: "#22c55e", superseded: "#ef4444",
};

function Badge({ value, colorMap }: { value: string; colorMap: Record<string, string> }) {
  const color = colorMap[value] ?? "#6b7280";
  return (
    <span style={{
      fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px",
      background: color + "22", color, border: `1px solid ${color}44`, textTransform: "capitalize",
    }}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "12px", fontSize: "13px", padding: "8px 0", borderBottom: "1px solid #111" }}>
      <span style={{ color: "#555", width: "140px", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#ccc" }}>{value ?? <span style={{ color: "#333" }}>—</span>}</span>
    </div>
  );
}

// Reusable inline asset search picker
function AssetPicker({
  excludeIds,
  onSelect,
  onCancel,
  placeholder = "Search by tag or name…",
}: {
  excludeIds: number[];
  onSelect: (asset: Asset) => void;
  onCancel: () => void;
  placeholder?: string;
}) {
  const { getToken } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Asset[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const token = await getToken();
      if (!token) return;
      const all = await fetchAssets(PROJECT_ID, token, { search: query, page_size: 20 }).catch(() => []);
      setResults(all.filter((a) => !excludeIds.includes(a.id)));
      setSearching(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, excludeIds, getToken]);

  return (
    <div style={{ marginTop: "10px" }}>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box", background: "#0a0a0a", border: "1px solid #333",
          borderRadius: "8px", padding: "8px 12px", color: "#ccc", fontSize: "13px", outline: "none",
        }}
      />
      {searching && <p style={{ color: "#555", fontSize: "12px", margin: "6px 0 0" }}>Searching…</p>}
      {results.length > 0 && (
        <div style={{ marginTop: "6px", border: "1px solid #222", borderRadius: "8px", overflow: "hidden" }}>
          {results.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              style={{
                display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px",
                background: "none", border: "none", borderBottom: "1px solid #1a1a1a", cursor: "pointer", textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#161616")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span style={{ color: "#f5a623", fontFamily: "monospace", fontWeight: 700, fontSize: "13px" }}>{a.tag}</span>
              {a.name && <span style={{ color: "#666", fontSize: "12px" }}>{a.name}</span>}
              <Badge value={a.status} colorMap={STATUS_COLOR} />
            </button>
          ))}
        </div>
      )}
      {!searching && query.trim() && results.length === 0 && (
        <p style={{ color: "#444", fontSize: "12px", margin: "6px 0 0" }}>No matching assets found.</p>
      )}
      <button
        onClick={onCancel}
        style={{ marginTop: "8px", background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer", padding: 0 }}
      >
        Cancel
      </button>
    </div>
  );
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { getToken } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [parent, setParent] = useState<Asset | null>(null);
  const [children, setChildren] = useState<Asset[]>([]);
  const [drawings, setDrawings] = useState<AssetDrawing[]>([]);

  const [site, setSite] = useState<Site | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [unit, setUnit] = useState<GeoUnit | null>(null);
  const [partition, setPartition] = useState<Partition | null>(null);

  const [discipline, setDiscipline] = useState<SystemDiscipline | null>(null);
  const [sysGroup, setSysGroup] = useState<SystemGroup | null>(null);
  const [subgroup, setSubgroup] = useState<SystemSubgroup | null>(null);

  // System edit state
  const [editingSystem, setEditingSystem] = useState(false);
  const [allDisciplines, setAllDisciplines] = useState<SystemDiscipline[]>([]);
  const [editGroupsList, setEditGroupsList] = useState<SystemGroup[]>([]);
  const [editSubgroupsList, setEditSubgroupsList] = useState<SystemSubgroup[]>([]);
  const [editDisciplineId, setEditDisciplineId] = useState("");
  const [editGroupId, setEditGroupId] = useState("");
  const [editSubgroupId, setEditSubgroupId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Relationship assignment UI
  const [showAssignParent, setShowAssignParent] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) return;
      try {
        const a = await fetchAsset(Number(id), token);
        setAsset(a);

        const [kids, drws] = await Promise.all([
          fetchAssetChildren(Number(id), token),
          fetchAssetDrawings(Number(id), token),
        ]);
        setChildren(kids);
        setDrawings(drws);

        if (a.parent_id) {
          fetchAsset(a.parent_id, token).then(setParent).catch(() => {});
        }

        const geoFetches: Promise<void>[] = [];
        if (a.site_id) geoFetches.push(fetchSite(a.site_id, token).then(setSite).catch(() => {}));
        if (a.location_id) geoFetches.push(fetchLocation(a.location_id, token).then(setLocation).catch(() => {}));
        if (a.unit_id) geoFetches.push(fetchUnit(a.unit_id, token).then(setUnit).catch(() => {}));
        if (a.partition_id) geoFetches.push(fetchPartition(a.partition_id, token).then(setPartition).catch(() => {}));

        // Resolve system path: subgroup → group → discipline
        if (a.subgroup_id) {
          geoFetches.push(
            fetchSubgroup(a.subgroup_id, token).then(async (sg) => {
              setSubgroup(sg);
              const g = await fetchGroup(sg.group_id, token).catch(() => null);
              if (g) {
                setSysGroup(g);
                const d = await fetchDiscipline(g.discipline_id, token).catch(() => null);
                if (d) setDiscipline(d);
              }
            }).catch(() => {})
          );
        }

        await Promise.all(geoFetches);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, getToken]);

  async function handleRemoveParent() {
    if (!asset) return;
    const token = await getToken();
    if (!token) return;
    try {
      await updateAsset(asset.id, { parent_id: null }, token);
      setAsset({ ...asset, parent_id: null });
      setParent(null);
    } catch (e: any) {
      setSaveError(e.message);
    }
  }

  async function handleAssignParent(selected: Asset) {
    if (!asset) return;
    const token = await getToken();
    if (!token) return;
    try {
      await updateAsset(asset.id, { parent_id: selected.id }, token);
      setAsset({ ...asset, parent_id: selected.id });
      setParent(selected);
      setShowAssignParent(false);
    } catch (e: any) {
      setSaveError(e.message);
    }
  }

  async function handleAddChild(selected: Asset) {
    if (!asset) return;
    const token = await getToken();
    if (!token) return;
    try {
      const updated = await updateAsset(selected.id, { parent_id: asset.id }, token);
      setChildren((prev) => {
        const exists = prev.find((c) => c.id === selected.id);
        if (exists) return prev;
        return [...prev, updated];
      });
      setShowAddChild(false);
    } catch (e: any) {
      setSaveError(e.message);
    }
  }

  async function handleRemoveChild(childId: number) {
    const token = await getToken();
    if (!token) return;
    try {
      await updateAsset(childId, { parent_id: null }, token);
      setChildren((prev) => prev.filter((c) => c.id !== childId));
    } catch (e: any) {
      setSaveError(e.message);
    }
  }

  async function openSystemEdit() {
    const token = await getToken();
    if (!token) return;
    const discs = await fetchDisciplines(PROJECT_ID, token).catch(() => []);
    setAllDisciplines(discs);
    // Pre-populate with current values if set
    if (discipline && sysGroup && subgroup) {
      setEditDisciplineId(String(discipline.id));
      const gs = await fetchGroups(discipline.id, token).catch(() => []);
      setEditGroupsList(gs);
      setEditGroupId(String(sysGroup.id));
      const ss = await fetchSubgroups(sysGroup.id, token).catch(() => []);
      setEditSubgroupsList(ss);
      setEditSubgroupId(String(subgroup.id));
    } else {
      setEditDisciplineId(""); setEditGroupId(""); setEditSubgroupId("");
      setEditGroupsList([]); setEditSubgroupsList([]);
    }
    setEditingSystem(true);
  }

  async function handleEditDisciplineChange(id: string) {
    setEditDisciplineId(id);
    setEditGroupId(""); setEditSubgroupId("");
    setEditGroupsList([]); setEditSubgroupsList([]);
    if (!id) return;
    const token = await getToken();
    if (!token) return;
    const gs = await fetchGroups(Number(id), token).catch(() => []);
    setEditGroupsList(gs);
  }

  async function handleEditGroupChange(id: string) {
    setEditGroupId(id);
    setEditSubgroupId(""); setEditSubgroupsList([]);
    if (!id) return;
    const token = await getToken();
    if (!token) return;
    const ss = await fetchSubgroups(Number(id), token).catch(() => []);
    setEditSubgroupsList(ss);
  }

  async function handleSaveSystem() {
    if (!asset || !editSubgroupId) return;
    const token = await getToken();
    if (!token) return;
    try {
      await updateAsset(asset.id, { subgroup_id: Number(editSubgroupId) }, token);
      setAsset({ ...asset, subgroup_id: Number(editSubgroupId) });
      // Resolve and update displayed names
      const sg = await fetchSubgroup(Number(editSubgroupId), token);
      setSubgroup(sg);
      const g = await fetchGroup(sg.group_id, token);
      setSysGroup(g);
      const d = await fetchDiscipline(g.discipline_id, token);
      setDiscipline(d);
      setEditingSystem(false);
    } catch (e: any) {
      setSaveError(e.message);
    }
  }

  if (loading) return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a" }}>
      <Sidebar active="assets" />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#555" }}>Loading...</p>
      </main>
    </div>
  );

  if (error || !asset) return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a" }}>
      <Sidebar active="assets" />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#ef4444" }}>{error ?? "Asset not found"}</p>
      </main>
    </div>
  );

  // IDs to exclude from pickers (self + existing children + current parent)
  const excludeFromParentPicker = [asset.id, ...children.map((c) => c.id)];
  const excludeFromChildPicker = [asset.id, ...(asset.parent_id ? [asset.parent_id] : []), ...children.map((c) => c.id)];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="assets" />

      <main style={{ flex: 1, overflow: "auto", padding: "40px" }}>
        <div style={{ maxWidth: "960px" }}>

          <Link href="/dashboard/assets" style={{ color: "#555", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
            ← Back to Assets
          </Link>

          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "32px", color: "#fff", margin: "0 0 10px" }}>
              <span style={{ color: "#f5a623", fontFamily: "monospace" }}>{asset.tag}</span>
              {asset.name && <span style={{ color: "#ccc", marginLeft: "12px", fontSize: "24px" }}>{asset.name}</span>}
            </h1>
            <div style={{ display: "flex", gap: "8px" }}>
              <Badge value={asset.status} colorMap={STATUS_COLOR} />
              <Badge value={asset.commissioning_status} colorMap={COMMISSIONING_COLOR} />
            </div>
          </div>

          {saveError && (
            <div style={{ background: "#ef444422", border: "1px solid #ef444444", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#fca5a5", fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
              <span>{saveError}</span>
              <button onClick={() => setSaveError(null)} style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer" }}>✕</button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

            {/* Details */}
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "24px" }}>
              <h2 style={sectionHeading}>Details</h2>
              <DetailRow label="Type" value={asset.type} />
              <DetailRow label="Description" value={asset.description} />
              <DetailRow label="Manufacturer" value={asset.manufacturer} />
              <DetailRow label="Model" value={asset.model} />
              <DetailRow label="Serial Number" value={asset.serial_number} />
              <DetailRow label="Supplier" value={asset.supplier} />
              <DetailRow label="PO Number" value={asset.po_number} />
              <DetailRow label="Delivery Date" value={asset.delivery_date} />
              <DetailRow label="Warranty Expiry" value={asset.warranty_expiry} />
              <DetailRow label="Planned Cost" value={asset.planned_cost ? `$${asset.planned_cost}` : null} />
              <DetailRow label="Actual Cost" value={asset.actual_cost ? `$${asset.actual_cost}` : null} />
              <DetailRow label="Created" value={new Date(asset.created_at).toLocaleDateString()} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Geography */}
              <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "24px" }}>
                <h2 style={sectionHeading}>Location</h2>
                <DetailRow label="Site" value={site ? `${site.name} (${site.code})` : asset.site_id ? `Site ${asset.site_id}` : null} />
                <DetailRow label="Location" value={location ? location.name : null} />
                <DetailRow label="Unit" value={unit ? unit.name : null} />
                <DetailRow label="Partition" value={partition ? partition.name : null} />
              </div>

              {/* System */}
              <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <h2 style={{ ...sectionHeading, margin: 0 }}>System</h2>
                  {!editingSystem && (
                    <button
                      onClick={openSystemEdit}
                      style={{ background: "none", border: "1px solid #333", borderRadius: "6px", color: "#888", fontSize: "12px", padding: "4px 10px", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f5a623")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#333")}
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingSystem ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Discipline */}
                    <label style={{ fontSize: "12px", color: "#555" }}>
                      Discipline
                      <select
                        value={editDisciplineId}
                        onChange={(e) => handleEditDisciplineChange(e.target.value)}
                        style={selectStyle}
                      >
                        <option value="">— Select discipline —</option>
                        {allDisciplines.map((d) => (
                          <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </label>

                    {/* Group */}
                    {editDisciplineId && (
                      <label style={{ fontSize: "12px", color: "#555" }}>
                        System
                        <select
                          value={editGroupId}
                          onChange={(e) => handleEditGroupChange(e.target.value)}
                          style={selectStyle}
                        >
                          <option value="">— Select system —</option>
                          {editGroupsList.map((g) => (
                            <option key={g.id} value={String(g.id)}>{g.name} ({g.code})</option>
                          ))}
                        </select>
                      </label>
                    )}

                    {/* Subgroup */}
                    {editGroupId && (
                      <label style={{ fontSize: "12px", color: "#555" }}>
                        Subsystem
                        <select
                          value={editSubgroupId}
                          onChange={(e) => setEditSubgroupId(e.target.value)}
                          style={selectStyle}
                        >
                          <option value="">— Select subsystem —</option>
                          {editSubgroupsList.map((s) => (
                            <option key={s.id} value={String(s.id)}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </label>
                    )}

                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button
                        onClick={() => setEditingSystem(false)}
                        style={{ flex: 1, background: "none", border: "1px solid #333", borderRadius: "6px", color: "#888", fontSize: "12px", padding: "7px", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveSystem}
                        disabled={!editSubgroupId}
                        style={{ flex: 1, background: "#f5a62322", border: "1px solid #f5a62344", borderRadius: "6px", color: "#f5a623", fontSize: "12px", padding: "7px", cursor: "pointer", fontWeight: 600, opacity: editSubgroupId ? 1 : 0.4 }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : discipline && sysGroup && subgroup ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ color: "#f5a623", fontSize: "12px", fontWeight: 600 }}>{discipline.name}</span>
                    <span style={{ color: "#333", fontSize: "12px" }}>›</span>
                    <span style={{ color: "#3b82f6", fontSize: "12px", fontWeight: 600 }}>{sysGroup.name}</span>
                    <span style={{ color: "#333", fontSize: "12px" }}>›</span>
                    <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 600 }}>{subgroup.name}</span>
                  </div>
                ) : (
                  <p style={{ color: "#444", fontSize: "13px", margin: 0 }}>No system assigned.</p>
                )}
              </div>

              {/* Parent asset */}
              <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <h2 style={{ ...sectionHeading, margin: 0 }}>Parent Asset</h2>
                  {!parent && !showAssignParent && (
                    <button
                      onClick={() => setShowAssignParent(true)}
                      style={{ background: "none", border: "1px solid #333", borderRadius: "6px", color: "#888", fontSize: "12px", padding: "4px 10px", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f5a623")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#333")}
                    >
                      + Assign
                    </button>
                  )}
                </div>

                {parent ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Link href={`/dashboard/assets/${parent.id}`}
                      style={{ color: "#f5a623", fontFamily: "monospace", fontWeight: 700, textDecoration: "none", fontSize: "14px" }}>
                      {parent.tag}
                      {parent.name && <span style={{ color: "#666", fontFamily: "'DM Sans', sans-serif", fontWeight: 400, marginLeft: "8px" }}>{parent.name}</span>}
                    </Link>
                    <button onClick={handleRemoveParent}
                      style={{ background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}>
                      Remove
                    </button>
                  </div>
                ) : showAssignParent ? (
                  <AssetPicker
                    excludeIds={excludeFromParentPicker}
                    onSelect={handleAssignParent}
                    onCancel={() => setShowAssignParent(false)}
                    placeholder="Search assets to set as parent…"
                  />
                ) : (
                  <p style={{ color: "#444", fontSize: "13px", margin: 0 }}>No parent assigned.</p>
                )}
              </div>
            </div>
          </div>

          {/* Related Drawings */}
          <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "24px", marginBottom: "16px" }}>
            <h2 style={sectionHeading}>Related Drawings ({drawings.length})</h2>
            {drawings.length === 0 ? (
              <p style={{ color: "#444", fontSize: "13px", margin: 0 }}>
                This asset has not been pinned on any drawings yet.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                    {["Document", "Category", "Status", "Page", ""].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", fontSize: "11px", color: "#444", fontWeight: 600, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drawings.map((d) => (
                    <tr key={d.document_id} style={{ borderBottom: "1px solid #111" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#0d0d0d")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "10px 12px" }}>
                        <Link href={`/dashboard/documents/${d.document_id}?page=${d.page_number}`}
                          style={{ color: "#f5a623", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
                          {d.document_name}
                        </Link>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#666" }}>{d.category ?? "—"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <Badge value={d.status} colorMap={DOC_STATUS_COLOR} />
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#666" }}>Page {d.page_number}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <Link href={`/dashboard/documents/${d.document_id}?page=${d.page_number}`}
                          style={{ color: "#555", fontSize: "12px", textDecoration: "none" }}
                          onMouseEnter={(e: any) => (e.currentTarget.style.color = "#f5a623")}
                          onMouseLeave={(e: any) => (e.currentTarget.style.color = "#555")}>
                          View drawing →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Children */}
          <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <h2 style={{ ...sectionHeading, margin: 0 }}>Child Assets ({children.length})</h2>
              {!showAddChild && (
                <button
                  onClick={() => setShowAddChild(true)}
                  style={{ background: "none", border: "1px solid #333", borderRadius: "6px", color: "#888", fontSize: "12px", padding: "4px 10px", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f5a623")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#333")}
                >
                  + Add Child
                </button>
              )}
            </div>

            {showAddChild && (
              <div style={{ marginBottom: "16px", padding: "14px", background: "#0d0d0d", borderRadius: "8px", border: "1px solid #1a1a1a" }}>
                <p style={{ color: "#888", fontSize: "12px", margin: "0 0 6px" }}>Search for an existing asset to make it a child of this one:</p>
                <AssetPicker
                  excludeIds={excludeFromChildPicker}
                  onSelect={handleAddChild}
                  onCancel={() => setShowAddChild(false)}
                  placeholder="Search assets to add as child…"
                />
              </div>
            )}

            {children.length === 0 && !showAddChild ? (
              <p style={{ color: "#444", fontSize: "13px", margin: 0 }}>No child assets assigned.</p>
            ) : children.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                    {["Tag", "Name", "Type", "Children", "Status", ""].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", fontSize: "11px", color: "#444", fontWeight: 600, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {children.map((child) => (
                    <tr key={child.id} style={{ borderBottom: "1px solid #111" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#0d0d0d")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "10px 12px" }}>
                        <Link href={`/dashboard/assets/${child.id}`}
                          style={{ color: "#f5a623", fontSize: "13px", fontWeight: 700, fontFamily: "monospace", textDecoration: "none" }}>
                          {child.tag}
                        </Link>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#ccc" }}>{child.name ?? "—"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#666" }}>{child.type ?? "—"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: child.children_count > 0 ? "#22c55e" : "#333" }}>
                        {child.children_count > 0 ? child.children_count : "—"}
                      </td>
                      <td style={{ padding: "10px 12px" }}><Badge value={child.status} colorMap={STATUS_COLOR} /></td>
                      <td style={{ padding: "10px 12px" }}>
                        <button
                          onClick={() => handleRemoveChild(child.id)}
                          style={{ background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

const sectionHeading: React.CSSProperties = {
  color: "#fff", fontSize: "13px", fontWeight: 700,
  margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em",
};

const selectStyle: React.CSSProperties = {
  display: "block", width: "100%", marginTop: "4px",
  background: "#0a0a0a", border: "1px solid #333", borderRadius: "6px",
  padding: "7px 10px", color: "#ccc", fontSize: "13px", outline: "none",
};
