"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ErrorBanner from "../../components/ErrorBanner";
import { useDocuments } from "../../../lib/hooks/useDocuments";
import { Site, Location, GeoUnit, Partition, fetchSites, fetchLocations, fetchUnits, fetchPartitions } from "../../../lib/models/geography";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:        { bg: "#f3f4f5", color: "#524534" },
  under_review: { bg: "#fef9c3", color: "#a16207" },
  approved:     { bg: "#dcfce7", color: "#15803d" },
  superseded:   { bg: "#fee2e2", color: "#dc2626" },
};

const inputStyle: React.CSSProperties = {
  background: "#f3f4f5", border: "none", color: "#191c1d",
  borderRadius: "8px", padding: "9px 12px", fontSize: "13px",
  outline: "none", fontFamily: "var(--font-inter, Inter, sans-serif)", width: "100%",
};

import { Document } from "../../../lib/models/documents";

export default function Documents() {
  const { documents, loading, uploading, error, canEdit, handleUpload, handleUpdate, handleDelete } = useDocuments();

  // Delete confirmation state
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!deleteDoc) return;
    setDeleting(true);
    await handleDelete(deleteDoc.id);
    setDeleting(false);
    setDeleteDoc(null);
  }

  // Edit modal state
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editSiteId, setEditSiteId] = useState<number | undefined>();
  const [editLocationId, setEditLocationId] = useState<number | undefined>();
  const [editUnitId, setEditUnitId] = useState<number | undefined>();
  const [editPartitionId, setEditPartitionId] = useState<number | undefined>();
  const [editLocations, setEditLocations] = useState<Location[]>([]);
  const [editUnits, setEditUnits] = useState<GeoUnit[]>([]);
  const [editPartitions, setEditPartitions] = useState<Partition[]>([]);
  const [saving, setSaving] = useState(false);

  function openEdit(doc: Document) {
    setEditDoc(doc);
    setEditName(doc.name);
    setEditCategory(doc.category || "General");
    setEditStatus(doc.status);
    setEditVersion(doc.version || "");
    setEditSiteId(doc.site_id ?? undefined);
    setEditLocationId(doc.location_id ?? undefined);
    setEditUnitId(doc.unit_id ?? undefined);
    setEditPartitionId(doc.partition_id ?? undefined);
    setEditLocations([]); setEditUnits([]); setEditPartitions([]);
    // Pre-load locations/units/partitions if site is set
    if (doc.site_id) {
      fetchLocations(doc.site_id!, "").then(setEditLocations).catch(() => {});
      if (doc.location_id) fetchUnits(doc.location_id, "").then(setEditUnits).catch(() => {});
      if (doc.unit_id) fetchPartitions(doc.unit_id, "").then(setEditPartitions).catch(() => {});
    }
  }

  async function onEditSiteChange(id: number | undefined) {
    setEditSiteId(id); setEditLocationId(undefined); setEditUnitId(undefined); setEditPartitionId(undefined);
    setEditLocations([]); setEditUnits([]); setEditPartitions([]);
    if (!id) return;
    fetchLocations(id, "").then(setEditLocations).catch(() => {});
  }

  async function onEditLocationChange(id: number | undefined) {
    setEditLocationId(id); setEditUnitId(undefined); setEditPartitionId(undefined);
    setEditUnits([]); setEditPartitions([]);
    if (!id) return;
    fetchUnits(id, "").then(setEditUnits).catch(() => {});
  }

  async function onEditUnitChange(id: number | undefined) {
    setEditUnitId(id); setEditPartitionId(undefined); setEditPartitions([]);
    if (!id) return;
    fetchPartitions(id, "").then(setEditPartitions).catch(() => {});
  }

  async function submitEdit() {
    if (!editDoc) return;
    setSaving(true);
    await handleUpdate(editDoc.id, {
      name: editName,
      category: editCategory,
      status: editStatus,
      version: editVersion || undefined,
      site_id: editSiteId ?? null,
      location_id: editLocationId ?? null,
      unit_id: editUnitId ?? null,
      partition_id: editPartitionId ?? null,
    });
    setSaving(false);
    setEditDoc(null);
  }

  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("General");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Geography state
  const [sites, setSites] = useState<Site[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [units, setUnits] = useState<GeoUnit[]>([]);
  const [partitions, setPartitions] = useState<Partition[]>([]);

  const [siteId, setSiteId] = useState<number | undefined>();
  const [locationId, setLocationId] = useState<number | undefined>();
  const [unitId, setUnitId] = useState<number | undefined>();
  const [partitionId, setPartitionId] = useState<number | undefined>();

  useEffect(() => {
    fetchSites("").then(setSites).catch(() => {});
  }, []);

  async function onSiteChange(id: number | undefined) {
    setSiteId(id); setLocationId(undefined); setUnitId(undefined); setPartitionId(undefined);
    setLocations([]); setUnits([]); setPartitions([]);
    if (!id) return;
    fetchLocations(id, "").then(setLocations).catch(() => {});
  }

  async function onLocationChange(id: number | undefined) {
    setLocationId(id); setUnitId(undefined); setPartitionId(undefined);
    setUnits([]); setPartitions([]);
    if (!id) return;
    fetchUnits(id, "").then(setUnits).catch(() => {});
  }

  async function onUnitChange(id: number | undefined) {
    setUnitId(id); setPartitionId(undefined); setPartitions([]);
    if (!id) return;
    fetchPartitions(id, "").then(setPartitions).catch(() => {});
  }

  function openModal() {
    setSelectedFile(null); setCategory("General");
    setSiteId(undefined); setLocationId(undefined); setUnitId(undefined); setPartitionId(undefined);
    setLocations([]); setUnits([]); setPartitions([]);
    setShowModal(true);
  }

  async function submitUpload() {
    if (!selectedFile) return;
    await handleUpload(selectedFile, {
      category,
      site_id: siteId,
      location_id: locationId,
      unit_id: unitId,
      partition_id: partitionId,
    });
    setShowModal(false);
  }

  return (
    <>
    <main style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(215,195,174,0.2)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.3em", display: "block", marginBottom: "4px" }}>
                Document Control
              </span>
              <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "32px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em" }}>
                Documents
              </h1>
              <p style={{ color: "#524534", fontSize: "13px", margin: "4px 0 0" }}>Upload and manage project drawings and documents</p>
            </div>
            <button
              onClick={openModal}
              style={{
                background: "linear-gradient(135deg, #835500, #f5a623)",
                color: "#fff", borderRadius: "8px", padding: "12px 24px",
                fontSize: "13px", fontWeight: 700, cursor: "pointer", border: "none",
                display: "flex", alignItems: "center", gap: "8px",
                fontFamily: "var(--font-manrope, Manrope, sans-serif)",
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>upload_file</span>
              Upload Document
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 40px" }}>
          {error && <ErrorBanner message={error} />}

          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
              <p style={{ color: "#857462", fontSize: "14px" }}>Loading documents...</p>
            </div>
          )}

          {!loading && documents.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#d7c3ae", display: "block", marginBottom: "16px" }}>folder_open</span>
              <p style={{ fontSize: "16px", color: "#191c1d", marginBottom: "6px", fontWeight: 700, fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}>No documents yet</p>
              <p style={{ fontSize: "13px", color: "#524534" }}>Upload your first document to get started.</p>
            </div>
          )}

          {!loading && documents.length > 0 && (
            <div style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f5" }}>
                    {["Name", "Category", "Geography", "Status", "Version", "Uploaded", canEdit ? "Actions" : ""].map((h) => (
                      <th key={h} style={{ padding: "12px 24px", fontSize: "10px", color: "#524534", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: "1px solid rgba(215,195,174,0.15)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#f5a623" }}>description</span>
                          <Link href={`/dashboard/documents/${doc.id}`}
                            style={{ color: "#191c1d", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#835500")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#191c1d")}>
                            {doc.name}
                          </Link>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "#524534" }}>{doc.category || "—"}</td>
                      <td style={{ padding: "16px 24px", fontSize: "12px", color: "#524534" }}>
                        {doc.site_name ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", rowGap: "2px" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "13px", color: "#857462", flexShrink: 0 }}>location_on</span>
                            <span style={{ fontWeight: 600, color: "#191c1d" }}>{doc.site_name}</span>
                            {doc.location_name && <>
                              <span style={{ color: "#d7c3ae" }}>›</span>
                              <span>{doc.location_name}</span>
                            </>}
                            {doc.unit_name && <>
                              <span style={{ color: "#d7c3ae" }}>›</span>
                              <span>{doc.unit_name}</span>
                            </>}
                            {doc.partition_name && <>
                              <span style={{ color: "#d7c3ae" }}>›</span>
                              <span>{doc.partition_name}</span>
                            </>}
                          </div>
                        ) : <span style={{ color: "#d7c3ae" }}>—</span>}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {(() => { const s = STATUS_STYLE[doc.status] ?? { bg: "#f3f4f5", color: "#524534" }; return (
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: s.bg, color: s.color, textTransform: "capitalize" }}>
                            {doc.status.replace("_", " ")}
                          </span>
                        ); })()}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "#524534" }}>{doc.version || "—"}</td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "#857462" }}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {canEdit && (
                          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <button
                              onClick={() => openEdit(doc)}
                              style={{ background: "none", border: "none", color: "#835500", fontSize: "12px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                              Edit
                            </button>
                            <button onClick={() => setDeleteDoc(doc)}
                              style={{ background: "none", border: "none", color: "#d7c3ae", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#d7c3ae")}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </main>

    {/* Modals */}
    {/* Delete Confirmation Modal */}
      {deleteDoc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(25,28,29,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", width: "420px", boxShadow: "0 40px 80px rgba(25,28,29,0.15)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "24px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "#dc2626", fontSize: "22px" }}>warning</span>
              </div>
              <div>
                <h2 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "18px", fontWeight: 800, color: "#191c1d", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                  Delete Document?
                </h2>
                <p style={{ fontSize: "13px", color: "#524534", margin: 0, lineHeight: 1.5 }}>
                  <strong style={{ color: "#191c1d" }}>{deleteDoc.name}</strong> will be permanently deleted along with all its revisions and drawing data. This cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  flex: 1, background: "#dc2626", color: "#fff", border: "none",
                  borderRadius: "8px", padding: "12px", fontSize: "13px", fontWeight: 700,
                  cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1,
                  fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                }}>
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setDeleteDoc(null)}
                style={{ flex: 1, padding: "12px", background: "#f3f4f5", border: "none", borderRadius: "8px", fontSize: "13px", color: "#524534", cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editDoc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(25,28,29,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", width: "520px", boxShadow: "0 40px 80px rgba(25,28,29,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "20px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.02em" }}>Edit Document</h2>
                <p style={{ fontSize: "13px", color: "#524534", margin: "4px 0 0" }}>Update metadata for this drawing</p>
              </div>
              <button onClick={() => setEditDoc(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#857462", fontSize: "20px", lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#524534", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
              </div>

              {/* Category + Status row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#524534", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>Category</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={inputStyle}>
                    <option value="General">General</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Structural">Structural</option>
                    <option value="P&ID">P&ID</option>
                    <option value="As-Built">As-Built</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#524534", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={inputStyle}>
                    <option value="draft">Draft</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="superseded">Superseded</option>
                  </select>
                </div>
              </div>

              {/* Version */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#524534", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>Version</label>
                <input value={editVersion} onChange={(e) => setEditVersion(e.target.value)} placeholder="e.g. v2.0" style={inputStyle} />
              </div>

              {/* Geography */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Location Assignment</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "#524534", fontWeight: 600, display: "block", marginBottom: "4px" }}>Site</label>
                    <select value={editSiteId ?? ""} onChange={(e) => onEditSiteChange(e.target.value ? Number(e.target.value) : undefined)} style={inputStyle}>
                      <option value="">None</option>
                      {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#524534", fontWeight: 600, display: "block", marginBottom: "4px" }}>Location</label>
                    <select value={editLocationId ?? ""} onChange={(e) => onEditLocationChange(e.target.value ? Number(e.target.value) : undefined)} style={{ ...inputStyle, opacity: !editSiteId ? 0.5 : 1 }} disabled={!editSiteId}>
                      <option value="">None</option>
                      {editLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#524534", fontWeight: 600, display: "block", marginBottom: "4px" }}>Unit</label>
                    <select value={editUnitId ?? ""} onChange={(e) => onEditUnitChange(e.target.value ? Number(e.target.value) : undefined)} style={{ ...inputStyle, opacity: !editLocationId ? 0.5 : 1 }} disabled={!editLocationId}>
                      <option value="">None</option>
                      {editUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#524534", fontWeight: 600, display: "block", marginBottom: "4px" }}>Partition</label>
                    <select value={editPartitionId ?? ""} onChange={(e) => setEditPartitionId(e.target.value ? Number(e.target.value) : undefined)} style={{ ...inputStyle, opacity: !editUnitId ? 0.5 : 1 }} disabled={!editUnitId}>
                      <option value="">None</option>
                      {editPartitions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "28px" }}>
              <button
                onClick={submitEdit}
                disabled={saving || !editName.trim()}
                style={{
                  flex: 1, background: "linear-gradient(135deg, #835500, #f5a623)", color: "#fff",
                  border: "none", borderRadius: "8px", padding: "12px", fontSize: "13px", fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
                  fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditDoc(null)} style={{ padding: "12px 20px", background: "#f3f4f5", border: "none", borderRadius: "8px", fontSize: "13px", color: "#524534", cursor: "pointer", fontWeight: 500 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(25,28,29,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", width: "480px", boxShadow: "0 40px 80px rgba(25,28,29,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "20px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.02em" }}>
                  Upload Document
                </h2>
                <p style={{ fontSize: "13px", color: "#524534", margin: "4px 0 0" }}>Assign a location so assets can be matched across drawings</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#857462", fontSize: "20px", lineHeight: 1 }}>✕</button>
            </div>

            {/* File picker */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#524534", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>
                File <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed rgba(215,195,174,0.5)", borderRadius: "10px", padding: "20px",
                  textAlign: "center", cursor: "pointer", background: selectedFile ? "rgba(245,166,35,0.04)" : "#f8f9fa",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f5a623")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(215,195,174,0.5)")}
              >
                {selectedFile ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span className="material-symbols-outlined" style={{ color: "#835500", fontSize: "20px" }}>description</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#191c1d" }}>{selectedFile.name}</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#d7c3ae", display: "block", marginBottom: "6px" }}>upload_file</span>
                    <span style={{ fontSize: "13px", color: "#857462" }}>Click to select a file</span>
                  </>
                )}
                <input ref={fileInputRef} type="file" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} />
              </div>
            </div>

            {/* Category */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#524534", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                <option value="General">General</option>
                <option value="Electrical">Electrical</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="Structural">Structural</option>
                <option value="P&ID">P&ID</option>
                <option value="As-Built">As-Built</option>
              </select>
            </div>

            {/* Geography */}
            <div style={{ marginBottom: "8px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                Location Assignment
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#524534", fontWeight: 600, display: "block", marginBottom: "4px" }}>Site</label>
                  <select value={siteId ?? ""} onChange={(e) => onSiteChange(e.target.value ? Number(e.target.value) : undefined)} style={inputStyle}>
                    <option value="">None</option>
                    {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#524534", fontWeight: 600, display: "block", marginBottom: "4px" }}>Location</label>
                  <select value={locationId ?? ""} onChange={(e) => onLocationChange(e.target.value ? Number(e.target.value) : undefined)} style={{ ...inputStyle, opacity: !siteId ? 0.5 : 1 }} disabled={!siteId}>
                    <option value="">None</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#524534", fontWeight: 600, display: "block", marginBottom: "4px" }}>Unit</label>
                  <select value={unitId ?? ""} onChange={(e) => onUnitChange(e.target.value ? Number(e.target.value) : undefined)} style={{ ...inputStyle, opacity: !locationId ? 0.5 : 1 }} disabled={!locationId}>
                    <option value="">None</option>
                    {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#524534", fontWeight: 600, display: "block", marginBottom: "4px" }}>Partition</label>
                  <select value={partitionId ?? ""} onChange={(e) => setPartitionId(e.target.value ? Number(e.target.value) : undefined)} style={{ ...inputStyle, opacity: !unitId ? 0.5 : 1 }} disabled={!unitId}>
                    <option value="">None</option>
                    {partitions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                onClick={submitUpload}
                disabled={!selectedFile || uploading}
                style={{
                  flex: 1, background: "linear-gradient(135deg, #835500, #f5a623)", color: "#fff",
                  border: "none", borderRadius: "8px", padding: "12px", fontSize: "13px", fontWeight: 700,
                  cursor: !selectedFile || uploading ? "not-allowed" : "pointer",
                  opacity: !selectedFile || uploading ? 0.6 : 1,
                  fontFamily: "var(--font-manrope, Manrope, sans-serif)",
                }}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: "12px 20px", background: "#f3f4f5", border: "none", borderRadius: "8px", fontSize: "13px", color: "#524534", cursor: "pointer", fontWeight: 500 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
