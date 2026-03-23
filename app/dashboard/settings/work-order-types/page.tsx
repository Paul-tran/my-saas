"use client";

import { useState } from "react";
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

  function onCategoryChange(cat: WOType["category"]) {
    setForm((f) => ({
      ...f, category: cat,
      asset_required: cat === "corrective" || cat === "preventive",
      geography_required: true,
    }));
  }

  return (
    <>
    <main style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "32px 40px 24px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(215,195,174,0.2)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#835500", textTransform: "uppercase", letterSpacing: "0.3em", display: "block", marginBottom: "4px" }}>Admin Settings</span>
              <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "32px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.03em" }}>Work Order Types</h1>
              <p style={{ color: "#524534", fontSize: "13px", margin: "4px 0 0" }}>
                Define the types of work orders available in your project.
              </p>
            </div>
            <button
              onClick={openCreate}
              style={{ background: "linear-gradient(135deg, #835500, #f5a623)", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}
            >
              + Add Type
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "24px 40px" }}>
          <div style={{ maxWidth: "800px" }}>
            {error && <ErrorBanner message={error} />}

            {loading && <p style={{ color: "#857462" }}>Loading...</p>}

            {!loading && woTypes.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px", background: "#fff", borderRadius: "12px", boxShadow: "0 20px 40px rgba(25,28,29,0.05)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#d7c3ae", display: "block", marginBottom: "16px" }}>assignment</span>
                <p style={{ fontSize: "16px", color: "#191c1d", marginBottom: "6px", fontWeight: 700, fontFamily: "var(--font-manrope, Manrope, sans-serif)" }}>No work order types yet</p>
                <p style={{ fontSize: "13px", color: "#524534" }}>Add a type to get started.</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {woTypes.map((wt) => (
                <div key={wt.id} style={{ background: "#fff", border: "1px solid rgba(215,195,174,0.2)", borderRadius: "10px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 8px rgba(25,28,29,0.04)" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: CATEGORY_COLOR[wt.category], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "#191c1d", fontWeight: 600, fontSize: "14px" }}>{wt.name}</span>
                      {!wt.is_active && (
                        <span style={{ fontSize: "11px", color: "#857462", background: "#f3f4f5", padding: "2px 8px", borderRadius: "4px" }}>Inactive</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                      <span style={{ fontSize: "12px", color: CATEGORY_COLOR[wt.category], fontWeight: 600 }}>{CATEGORY_LABEL[wt.category]}</span>
                      <span style={{ fontSize: "12px", color: "#857462" }}>{wt.asset_required ? "✓ Asset required" : "○ Asset optional"}</span>
                      <span style={{ fontSize: "12px", color: "#857462" }}>{wt.geography_required ? "✓ Site required" : "○ Site optional"}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => openEdit(wt)}
                      style={{ background: "#f3f4f5", border: "none", color: "#524534", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>
                      Edit
                    </button>
                    <button onClick={() => handleUpdate(wt.id, { is_active: !wt.is_active })}
                      style={{ background: "#f3f4f5", border: "none", color: wt.is_active ? "#a16207" : "#15803d", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>
                      {wt.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => { if (confirm(`Delete "${wt.name}"?`)) handleDelete(wt.id); }}
                      style={{ background: "#fff0f0", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </main>

    {/* Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(25,28,29,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", width: "460px", boxShadow: "0 40px 80px rgba(25,28,29,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ color: "#191c1d", margin: 0, fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "20px", fontWeight: 700 }}>
                {editingId ? "Edit Work Order Type" : "New Work Order Type"}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#857462", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>

            <form onSubmit={submitForm} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#857462" }}>
                Type Name *
                <input
                  required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Electrical Fault, HVAC Service"
                  style={{ background: "#f3f4f5", border: "none", color: "#191c1d", borderRadius: "6px", padding: "9px 12px", fontSize: "13px", outline: "none" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#857462" }}>
                Base Category *
                <select
                  value={form.category} onChange={(e) => onCategoryChange(e.target.value as WOType["category"])}
                  style={{ background: "#f3f4f5", border: "none", color: "#191c1d", borderRadius: "6px", padding: "9px 12px", fontSize: "13px", outline: "none" }}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
                <span style={{ fontSize: "12px", color: "#857462" }}>
                  {form.category === "corrective" && "Shows fault description, failure cause, and resolution fields."}
                  {form.category === "preventive" && "Shows PM checklist, recurrence schedule, and last service date."}
                  {form.category === "inspection" && "Shows pass/fail checklist, condition rating, and sign-off."}
                  {form.category === "operations" && "Shows task steps and shift start/end times."}
                </span>
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Toggle label="Asset required" hint="User must select an asset when creating this work order type" value={form.asset_required} onChange={(v) => setForm({ ...form, asset_required: v })} />
                <Toggle label="Site required" hint="User must select a site when creating this work order type" value={form.geography_required} onChange={(v) => setForm({ ...form, geography_required: v })} />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: "none", border: "1px solid rgba(215,195,174,0.4)", color: "#857462", borderRadius: "8px", padding: "10px", cursor: "pointer", fontSize: "13px" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, background: "linear-gradient(135deg, #835500, #f5a623)", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>
                  {editingId ? "Save Changes" : "Create Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#f8f9fa", border: "1px solid rgba(215,195,174,0.2)", borderRadius: "8px" }}>
      <div>
        <div style={{ fontSize: "13px", color: "#191c1d", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: "12px", color: "#857462", marginTop: "2px" }}>{hint}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", background: value ? "#f5a623" : "#d7c3ae", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
      >
        <span style={{ position: "absolute", top: "3px", left: value ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </button>
    </div>
  );
}
