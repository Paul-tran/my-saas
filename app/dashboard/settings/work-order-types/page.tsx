"use client";

import { useState } from "react";
import Sidebar from "../../../components/Sidebar";
import ErrorBanner from "../../../components/ErrorBanner";
import { useWOTypes } from "../../../../lib/hooks/useWOTypes";
import { WOType, WOTypeCreate, CATEGORY_LABEL, CATEGORY_COLOR } from "../../../../lib/models/wotypes";

const CATEGORIES: WOType["category"][] = ["corrective", "preventive", "inspection", "operations"];

export default function WOTypesSettingsPage() {
  const { woTypes, loading, error, handleCreate, handleUpdate, handleDelete } = useWOTypes();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<WOTypeCreate>({
    name: "", category: "corrective", asset_required: false, geography_required: true,
  });

  function openCreate() {
    setForm({ name: "", category: "corrective", asset_required: false, geography_required: true });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(wt: WOType) {
    setForm({ name: wt.name, category: wt.category, asset_required: wt.asset_required, geography_required: wt.geography_required });
    setEditingId(wt.id);
    setShowForm(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      await handleUpdate(editingId, form);
    } else {
      await handleCreate(form);
    }
    setShowForm(false);
  }

  // Auto-set defaults when category changes
  function onCategoryChange(cat: WOType["category"]) {
    setForm((f) => ({
      ...f, category: cat,
      asset_required: cat === "corrective" || cat === "preventive",
      geography_required: true,
    }));
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="settings" />

      <main style={{ flex: 1, overflow: "auto", padding: "40px" }}>
        <div style={{ maxWidth: "800px" }}>
          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <p style={{ color: "#555", fontSize: "13px", margin: "0 0 6px" }}>Settings</p>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#fff", margin: "0 0 8px" }}>Work Order Types</h1>
            <p style={{ color: "#555", fontSize: "14px", margin: 0 }}>
              Define the types of work orders available in your project. Each type is based on one of the four base categories which determines the fields shown on the work order.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          {/* Type list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            {loading && <p style={{ color: "#555" }}>Loading...</p>}

            {!loading && woTypes.length === 0 && (
              <div style={{ padding: "40px", textAlign: "center", color: "#333", border: "1px dashed #1a1a1a", borderRadius: "10px" }}>
                No work order types yet. Add one to get started.
              </div>
            )}

            {woTypes.map((wt) => (
              <div key={wt.id} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Category dot */}
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: CATEGORY_COLOR[wt.category], flexShrink: 0 }} />

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>{wt.name}</span>
                    {!wt.is_active && (
                      <span style={{ fontSize: "11px", color: "#555", background: "#1a1a1a", padding: "2px 8px", borderRadius: "4px" }}>Inactive</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                    <span style={{ fontSize: "12px", color: CATEGORY_COLOR[wt.category] }}>{CATEGORY_LABEL[wt.category]}</span>
                    <span style={{ fontSize: "12px", color: "#444" }}>
                      {wt.asset_required ? "✓ Asset required" : "○ Asset optional"}
                    </span>
                    <span style={{ fontSize: "12px", color: "#444" }}>
                      {wt.geography_required ? "✓ Site required" : "○ Site optional"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => openEdit(wt)}
                    style={{ background: "#1a1a1a", border: "1px solid #222", color: "#888", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleUpdate(wt.id, { is_active: !wt.is_active })}
                    style={{ background: "#1a1a1a", border: "1px solid #222", color: wt.is_active ? "#f59e0b" : "#22c55e", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                  >
                    {wt.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${wt.name}"?`)) handleDelete(wt.id); }}
                    style={{ background: "#1a1a1a", border: "1px solid #2a1a1a", color: "#ef4444", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={openCreate}
            style={{ background: "#f5a623", color: "#000", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
          >
            + Add Work Order Type
          </button>
        </div>
      </main>

      {/* Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "32px", width: "460px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ color: "#fff", margin: 0, fontFamily: "'DM Serif Display', serif", fontSize: "20px" }}>
                {editingId ? "Edit Work Order Type" : "New Work Order Type"}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>

            <form onSubmit={submitForm} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Name */}
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#888" }}>
                Type Name *
                <input
                  required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Electrical Fault, HVAC Service"
                  style={{ background: "#0a0a0a", border: "1px solid #222", color: "#fff", borderRadius: "6px", padding: "9px 12px", fontSize: "13px" }}
                />
              </label>

              {/* Category */}
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#888" }}>
                Base Category *
                <select
                  value={form.category} onChange={(e) => onCategoryChange(e.target.value as WOType["category"])}
                  style={{ background: "#0a0a0a", border: "1px solid #222", color: "#fff", borderRadius: "6px", padding: "9px 12px", fontSize: "13px" }}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
                <span style={{ fontSize: "12px", color: "#444" }}>
                  {form.category === "corrective" && "Shows fault description, failure cause, and resolution fields."}
                  {form.category === "preventive" && "Shows PM checklist, recurrence schedule, and last service date."}
                  {form.category === "inspection" && "Shows pass/fail checklist, condition rating, and sign-off."}
                  {form.category === "operations" && "Shows task steps and shift start/end times."}
                </span>
              </label>

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Toggle
                  label="Asset required"
                  hint="User must select an asset when creating this work order type"
                  value={form.asset_required}
                  onChange={(v) => setForm({ ...form, asset_required: v })}
                />
                <Toggle
                  label="Site required"
                  hint="User must select a site when creating this work order type"
                  value={form.geography_required}
                  onChange={(v) => setForm({ ...form, geography_required: v })}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: "none", border: "1px solid #222", color: "#555", borderRadius: "8px", padding: "10px", cursor: "pointer", fontSize: "14px" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, background: "#f5a623", border: "none", color: "#000", borderRadius: "8px", padding: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 700 }}>
                  {editingId ? "Save Changes" : "Create Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px" }}>
      <div>
        <div style={{ fontSize: "13px", color: "#ccc", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: "12px", color: "#444", marginTop: "2px" }}>{hint}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
          background: value ? "#f5a623" : "#222", position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: "3px", left: value ? "23px" : "3px",
          width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}
