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

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:      { bg: "#dcfce7", color: "#15803d" },
  inactive:    { bg: "#fee2e2", color: "#dc2626" },
  maintenance: { bg: "#fef9c3", color: "#a16207" },
};
const COMMISSIONING_STYLE: Record<string, { bg: string; color: string }> = {
  not_started: { bg: "#f3f4f5", color: "#524534" },
  in_progress:  { bg: "#dbeafe", color: "#1d4ed8" },
  completed:    { bg: "#dcfce7", color: "#15803d" },
  failed:       { bg: "#fee2e2", color: "#dc2626" },
};
const DOC_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:        { bg: "#f3f4f5", color: "#524534" },
  under_review: { bg: "#fef9c3", color: "#a16207" },
  approved:     { bg: "#dcfce7", color: "#15803d" },
  superseded:   { bg: "#fee2e2", color: "#dc2626" },
};

function Badge({ value, styleMap }: { value: string; styleMap: Record<string, { bg: string; color: string }> }) {
  const s = styleMap[value] ?? { bg: "#f3f4f5", color: "#524534" };
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: s.bg, color: s.color, textTransform: "capitalize" }}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "12px", fontSize: "13px", padding: "8px 0", borderBottom: "1px solid rgba(215,195,174,0.12)" }}>
      <span style={{ color: "#857462", width: "140px", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#191c1d" }}>{value ?? <span style={{ color: "#d7c3ae" }}>—</span>}</span>
    </div>
  );
}

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
        style={{ width: "100%", boxSizing: "border-box", background: "#f3f4f5", border: "none", borderRadius: "8px", padding: "8px 12px", color: "#191c1d", fontSize: "13px", outline: "none" }}
      />
      {searching && <p style={{ color: "#857462", fontSize: "12px", margin: "6px 0 0" }}>Searching…</p>}
      {results.length > 0 && (
        <div style={{ marginTop: "6px", border: "1px solid rgba(215,195,174,0.2)", borderRadius: "8px", overflow: "hidden" }}>
          {results.map((a) => {
            const s = STATUS_STYLE[a.status] ?? { bg: "#f3f4f5", color: "#524534" };
            return (
              <button
                key={a.id}
                onClick={() => onSelect(a)}
                style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px", background: "none", border: "none", borderBottom: "1px solid rgba(215,195,174,0.15)", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <span style={{ color: "#835500", fontFamily: "monospace", fontWeight: 700, fontSize: "13px" }}>{a.tag}</span>
                {a.name && <span style={{ color: "#857462", fontSize: "12px" }}>{a.name}</span>}
                <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: s.bg, color: s.color }}>{a.status}</span>
              </button>
            );
          })}
        </div>
      )}
      {!searching && query.trim() && results.length === 0 && (
        <p style={{ color: "#857462", fontSize: "12px", margin: "6px 0 0" }}>No matching assets found.</p>
      )}
      <button
        onClick={onCancel}
        style={{ marginTop: "8px", background: "none", border: "none", color: "#857462", fontSize: "12px", cursor: "pointer", padding: 0 }}
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
    } catch (e: any) { setSaveError(e.message); }
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
    } catch (e: any) { setSaveError(e.message); }
  }

  async function handleAddChild(selected: Asset) {
    if (!asset) return;
    const token = await getToken();
    if (!token) return;
    try {
      const updated = await updateAsset(selected.id, { parent_id: asset.id }, token);
      setChildren((prev) => {
        if (prev.find((c) => c.id === selected.id)) return prev;
        return [...prev, updated];
      });
      setShowAddChild(false);
    } catch (e: any) { setSaveError(e.message); }
  }

  async function handleRemoveChild(childId: number) {
    const token = await getToken();
    if (!token) return;
    try {
      await updateAsset(childId, { parent_id: null }, token);
      setChildren((prev) => prev.filter((c) => c.id !== childId));
    } catch (e: any) { setSaveError(e.message); }
  }

  async function openSystemEdit() {
    const token = await getToken();
    if (!token) return;
    const discs = await fetchDisciplines(PROJECT_ID, token).catch(() => []);
    setAllDisciplines(discs);
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
    setEditGroupId(""); setEditSubgroupId(""); setEditGroupsList([]); setEditSubgroupsList([]);
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
      const sg = await fetchSubgroup(Number(editSubgroupId), token);
      setSubgroup(sg);
      const g = await fetchGroup(sg.group_id, token);
      setSysGroup(g);
      const d = await fetchDiscipline(g.discipline_id, token);
      setDiscipline(d);
      setEditingSystem(false);
    } catch (e: any) { setSaveError(e.message); }
  }

  const cardStyle = { background: "#fff", border: "1px solid rgba(215,195,174,0.2)", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(25,28,29,0.05)" };

  if (loading) return (
    <div style={{ display: "flex", height: "100vh", background: "#f8f9fa", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
      <Sidebar active="assets" />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#857462" }}>Loading...</p>
      </main>
    </div>
  );

  if (error || !asset) return (
    <div style={{ display: "flex", height: "100vh", background: "#f8f9fa", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
      <Sidebar active="assets" />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#dc2626" }}>{error ?? "Asset not found"}</p>
      </main>
    </div>
  );

  const excludeFromParentPicker = [asset.id, ...children.map((c) => c.id)];
  const excludeFromChildPicker = [asset.id, ...(asset.parent_id ? [asset.parent_id] : []), ...children.map((c) => c.id)];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8f9fa", fontFamily: "var(--font-inter, Inter, sans-serif)", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <Sidebar active="assets" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "24px 40px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(215,195,174,0.2)", flexShrink: 0 }}>
          <Link href="/dashboard/assets" style={{ color: "#857462", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span> Back to Assets
          </Link>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "28px", fontWeight: 800, color: "#191c1d", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                <span style={{ color: "#835500", fontFamily: "monospace" }}>{asset.tag}</span>
                {asset.name && <span style={{ color: "#524534", marginLeft: "12px", fontSize: "22px", fontWeight: 600 }}>{asset.name}</span>}
              </h1>
              <div style={{ display: "flex", gap: "8px" }}>
                <Badge value={asset.status} styleMap={STATUS_STYLE} />
                <Badge value={asset.commissioning_status} styleMap={COMMISSIONING_STYLE} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "24px 40px" }}>
          {saveError && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#dc2626", fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
              <span>{saveError}</span>
              <button onClick={() => setSaveError(null)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>✕</button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

            {/* Details */}
            <div style={cardStyle}>
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
              <div style={cardStyle}>
                <h2 style={sectionHeading}>Location</h2>
                <DetailRow label="Site" value={site ? `${site.name} (${site.code})` : asset.site_id ? `Site ${asset.site_id}` : null} />
                <DetailRow label="Location" value={location ? location.name : null} />
                <DetailRow label="Unit" value={unit ? unit.name : null} />
                <DetailRow label="Partition" value={partition ? partition.name : null} />
              </div>

              {/* System */}
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <h2 style={{ ...sectionHeading, margin: 0 }}>System</h2>
                  {!editingSystem && (
                    <button
                      onClick={openSystemEdit}
                      style={{ background: "none", border: "1px solid rgba(215,195,174,0.4)", borderRadius: "6px", color: "#857462", fontSize: "12px", padding: "4px 10px", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f5a623")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(215,195,174,0.4)")}
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingSystem ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label style={{ fontSize: "12px", color: "#857462" }}>
                      Discipline
                      <select value={editDisciplineId} onChange={(e) => handleEditDisciplineChange(e.target.value)} style={selectStyle}>
                        <option value="">— Select discipline —</option>
                        {allDisciplines.map((d) => (
                          <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </label>
                    {editDisciplineId && (
                      <label style={{ fontSize: "12px", color: "#857462" }}>
                        System
                        <select value={editGroupId} onChange={(e) => handleEditGroupChange(e.target.value)} style={selectStyle}>
                          <option value="">— Select system —</option>
                          {editGroupsList.map((g) => (
                            <option key={g.id} value={String(g.id)}>{g.name} ({g.code})</option>
                          ))}
                        </select>
                      </label>
                    )}
                    {editGroupId && (
                      <label style={{ fontSize: "12px", color: "#857462" }}>
                        Subsystem
                        <select value={editSubgroupId} onChange={(e) => setEditSubgroupId(e.target.value)} style={selectStyle}>
                          <option value="">— Select subsystem —</option>
                          {editSubgroupsList.map((s) => (
                            <option key={s.id} value={String(s.id)}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button onClick={() => setEditingSystem(false)} style={{ flex: 1, background: "none", border: "1px solid rgba(215,195,174,0.4)", borderRadius: "6px", color: "#857462", fontSize: "12px", padding: "7px", cursor: "pointer" }}>Cancel</button>
                      <button onClick={handleSaveSystem} disabled={!editSubgroupId} style={{ flex: 1, background: "linear-gradient(135deg, #835500, #f5a623)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", padding: "7px", cursor: "pointer", fontWeight: 600, opacity: editSubgroupId ? 1 : 0.4 }}>Save</button>
                    </div>
                  </div>
                ) : discipline && sysGroup && subgroup ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ color: "#835500", fontSize: "12px", fontWeight: 600 }}>{discipline.name}</span>
                    <span style={{ color: "#d7c3ae", fontSize: "12px" }}>›</span>
                    <span style={{ color: "#1d4ed8", fontSize: "12px", fontWeight: 600 }}>{sysGroup.name}</span>
                    <span style={{ color: "#d7c3ae", fontSize: "12px" }}>›</span>
                    <span style={{ color: "#15803d", fontSize: "12px", fontWeight: 600 }}>{subgroup.name}</span>
                  </div>
                ) : (
                  <p style={{ color: "#857462", fontSize: "13px", margin: 0 }}>No system assigned.</p>
                )}
              </div>

              {/* Parent asset */}
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <h2 style={{ ...sectionHeading, margin: 0 }}>Parent Asset</h2>
                  {!parent && !showAssignParent && (
                    <button
                      onClick={() => setShowAssignParent(true)}
                      style={{ background: "none", border: "1px solid rgba(215,195,174,0.4)", borderRadius: "6px", color: "#857462", fontSize: "12px", padding: "4px 10px", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f5a623")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(215,195,174,0.4)")}
                    >
                      + Assign
                    </button>
                  )}
                </div>

                {parent ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Link href={`/dashboard/assets/${parent.id}`}
                      style={{ color: "#835500", fontFamily: "monospace", fontWeight: 700, textDecoration: "none", fontSize: "14px" }}>
                      {parent.tag}
                      {parent.name && <span style={{ color: "#857462", fontFamily: "var(--font-inter, Inter, sans-serif)", fontWeight: 400, marginLeft: "8px" }}>{parent.name}</span>}
                    </Link>
                    <button onClick={handleRemoveParent}
                      style={{ background: "none", border: "none", color: "#d7c3ae", fontSize: "12px", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#d7c3ae")}>
                      Remove
                    </button>
                  </div>
                ) : showAssignParent ? (
                  <AssetPicker excludeIds={excludeFromParentPicker} onSelect={handleAssignParent} onCancel={() => setShowAssignParent(false)} placeholder="Search assets to set as parent…" />
                ) : (
                  <p style={{ color: "#857462", fontSize: "13px", margin: 0 }}>No parent assigned.</p>
                )}
              </div>
            </div>
          </div>

          {/* Related Drawings */}
          <div style={{ ...cardStyle, marginBottom: "16px" }}>
            <h2 style={sectionHeading}>Related Drawings ({drawings.length})</h2>
            {drawings.length === 0 ? (
              <p style={{ color: "#857462", fontSize: "13px", margin: 0 }}>This asset has not been pinned on any drawings yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f5" }}>
                    {["Document", "Category", "Status", "Page", ""].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", fontSize: "10px", color: "#524534", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drawings.map((d) => (
                    <tr key={d.document_id} style={{ borderBottom: "1px solid rgba(215,195,174,0.15)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "10px 12px" }}>
                        <Link href={`/dashboard/documents/${d.document_id}?page=${d.page_number}`}
                          style={{ color: "#835500", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
                          {d.document_name}
                        </Link>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#524534" }}>{d.category ?? "—"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <Badge value={d.status} styleMap={DOC_STATUS_STYLE} />
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#524534" }}>Page {d.page_number}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <Link href={`/dashboard/documents/${d.document_id}?page=${d.page_number}`}
                          style={{ color: "#857462", fontSize: "12px", textDecoration: "none" }}
                          onMouseEnter={(e: any) => (e.currentTarget.style.color = "#835500")}
                          onMouseLeave={(e: any) => (e.currentTarget.style.color = "#857462")}>
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
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <h2 style={{ ...sectionHeading, margin: 0 }}>Child Assets ({children.length})</h2>
              {!showAddChild && (
                <button
                  onClick={() => setShowAddChild(true)}
                  style={{ background: "none", border: "1px solid rgba(215,195,174,0.4)", borderRadius: "6px", color: "#857462", fontSize: "12px", padding: "4px 10px", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f5a623")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(215,195,174,0.4)")}
                >
                  + Add Child
                </button>
              )}
            </div>

            {showAddChild && (
              <div style={{ marginBottom: "16px", padding: "14px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid rgba(215,195,174,0.2)" }}>
                <p style={{ color: "#857462", fontSize: "12px", margin: "0 0 6px" }}>Search for an existing asset to make it a child of this one:</p>
                <AssetPicker excludeIds={excludeFromChildPicker} onSelect={handleAddChild} onCancel={() => setShowAddChild(false)} placeholder="Search assets to add as child…" />
              </div>
            )}

            {children.length === 0 && !showAddChild ? (
              <p style={{ color: "#857462", fontSize: "13px", margin: 0 }}>No child assets assigned.</p>
            ) : children.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f5" }}>
                    {["Tag", "Name", "Type", "Children", "Status", ""].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", fontSize: "10px", color: "#524534", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {children.map((child) => (
                    <tr key={child.id} style={{ borderBottom: "1px solid rgba(215,195,174,0.15)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "10px 12px" }}>
                        <Link href={`/dashboard/assets/${child.id}`} style={{ color: "#835500", fontSize: "13px", fontWeight: 700, fontFamily: "monospace", textDecoration: "none" }}>
                          {child.tag}
                        </Link>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#191c1d" }}>{child.name ?? "—"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#524534" }}>{child.type ?? "—"}</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: child.children_count > 0 ? "#15803d" : "#d7c3ae" }}>
                        {child.children_count > 0 ? child.children_count : "—"}
                      </td>
                      <td style={{ padding: "10px 12px" }}><Badge value={child.status} styleMap={STATUS_STYLE} /></td>
                      <td style={{ padding: "10px 12px" }}>
                        <button
                          onClick={() => handleRemoveChild(child.id)}
                          style={{ background: "none", border: "none", color: "#d7c3ae", fontSize: "12px", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#d7c3ae")}
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
  color: "#191c1d", fontSize: "12px", fontWeight: 700,
  margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.08em",
};

const selectStyle: React.CSSProperties = {
  display: "block", width: "100%", marginTop: "4px",
  background: "#f3f4f5", border: "none", borderRadius: "6px",
  padding: "7px 10px", color: "#191c1d", fontSize: "13px", outline: "none",
};
