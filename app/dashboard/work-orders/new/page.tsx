"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Sidebar from "../../../components/Sidebar";
import ErrorBanner from "../../../components/ErrorBanner";
import { useWOTypes } from "../../../../lib/hooks/useWOTypes";
import { createWorkOrder, WorkOrderCreate } from "../../../../lib/models/workorders";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "../../../../lib/models/wotypes";
import { apiFetch } from "../../../../lib/api";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

type GeoOption = { id: number; name: string };

export default function NewWorkOrderPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { woTypes, loading: typesLoading } = useWOTypes();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step: 1 = pick type, 2 = fill form
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  // Geography state
  const [sites, setSites] = useState<GeoOption[]>([]);
  const [locations, setLocations] = useState<GeoOption[]>([]);
  const [units, setUnits] = useState<GeoOption[]>([]);
  const [partitions, setPartitions] = useState<GeoOption[]>([]);
  const [assets, setAssets] = useState<GeoOption[]>([]);

  const [siteId, setSiteId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [partitionId, setPartitionId] = useState("");
  const [assetId, setAssetId] = useState("");

  // Core fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Corrective fields
  const [faultDescription, setFaultDescription] = useState("");
  const [failureCause, setFailureCause] = useState("unknown");
  const [resolution, setResolution] = useState("");

  // PM fields
  const [recurrence, setRecurrence] = useState("one_off");
  const [lastServiced, setLastServiced] = useState("");
  const [pmItems, setPmItems] = useState<string[]>([""]);

  // Inspection fields
  const [conditionRating, setConditionRating] = useState("");
  const [signedOffBy, setSignedOffBy] = useState("");
  const [inspectionItems, setInspectionItems] = useState<string[]>([""]);

  // Operations fields
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);

  const selectedType = woTypes.find((t) => t.id === selectedTypeId);

  // Load sites on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const data = await apiFetch<GeoOption[]>(`/api/v1/projects/${PROJECT_ID}/sites`, token!);
        setSites(data);
      } catch { /* no sites yet */ }
    })();
  }, []);

  // Cascade: site → locations
  useEffect(() => {
    setLocationId(""); setUnitId(""); setPartitionId(""); setLocations([]); setUnits([]); setPartitions([]);
    if (!siteId) { setAssets([]); setAssetId(""); return; }
    (async () => {
      try {
        const token = await getToken();
        const [locs, assetList] = await Promise.all([
          apiFetch<GeoOption[]>(`/api/v1/sites/${siteId}/locations`, token!),
          apiFetch<GeoOption[]>(`/api/v1/projects/${PROJECT_ID}/assets?site_id=${siteId}`, token!),
        ]);
        setLocations(locs);
        setAssets(assetList);
      } catch { }
    })();
  }, [siteId]);

  // Cascade: location → units
  useEffect(() => {
    setUnitId(""); setPartitionId(""); setUnits([]); setPartitions([]);
    if (!locationId) return;
    (async () => {
      try {
        const token = await getToken();
        const data = await apiFetch<GeoOption[]>(`/api/v1/locations/${locationId}/units`, token!);
        setUnits(data);
      } catch { }
    })();
  }, [locationId]);

  // Cascade: unit → partitions
  useEffect(() => {
    setPartitionId(""); setPartitions([]);
    if (!unitId) return;
    (async () => {
      try {
        const token = await getToken();
        const data = await apiFetch<GeoOption[]>(`/api/v1/units/${unitId}/partitions`, token!);
        setPartitions(data);
      } catch { }
    })();
  }, [unitId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;
    setError(null);
    setSubmitting(true);

    try {
      const token = await getToken();
      const payload: WorkOrderCreate = {
        wo_type_id: selectedType.id,
        title,
        description,
        priority: priority as any,
        site_id: siteId ? Number(siteId) : undefined,
        location_id: locationId ? Number(locationId) : undefined,
        unit_id: unitId ? Number(unitId) : undefined,
        partition_id: partitionId ? Number(partitionId) : undefined,
        asset_id: assetId ? Number(assetId) : undefined,
        assigned_to: assignedTo || undefined,
        scheduled_date: scheduledDate || undefined,
        due_date: dueDate || undefined,
        notes,
      };

      if (selectedType.category === "corrective") {
        payload.corrective_detail = { fault_description: faultDescription, failure_cause: failureCause as any, resolution };
      } else if (selectedType.category === "preventive") {
        payload.pm_detail = {
          recurrence: recurrence as any,
          last_serviced_date: lastServiced || undefined,
          checklist_items: pmItems.filter(Boolean).map((d, i) => ({ description: d, order_index: i })),
        };
      } else if (selectedType.category === "inspection") {
        payload.inspection_detail = {
          condition_rating: conditionRating ? Number(conditionRating) : undefined,
          signed_off_by: signedOffBy || undefined,
          checklist_items: inspectionItems.filter(Boolean).map((d, i) => ({ description: d, order_index: i })),
        };
      } else if (selectedType.category === "operations") {
        payload.operations_detail = {
          shift_start: shiftStart || undefined,
          shift_end: shiftEnd || undefined,
          steps: steps.filter(Boolean).map((d, i) => ({ description: d, order_index: i })),
        };
      }

      const wo = await createWorkOrder(PROJECT_ID, payload, token!);
      router.push(`/dashboard/work-orders/${wo.id}`);
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  // ── Step 1: pick type ──────────────────────────────────────────────────────
  if (step === 1) {
    const activeTypes = woTypes.filter((t) => t.is_active);
    const byCategory = ["corrective", "preventive", "inspection", "operations"] as const;

    return (
      <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
        <Sidebar active="work-orders" />
        <main style={{ flex: 1, overflow: "auto", padding: "40px" }}>
          <div style={{ maxWidth: "700px" }}>
            <button onClick={() => router.push("/dashboard/work-orders")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "13px", marginBottom: "16px", padding: 0 }}>
              ← Back to Work Orders
            </button>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#fff", margin: "0 0 8px" }}>New Work Order</h1>
            <p style={{ color: "#555", fontSize: "14px", margin: "0 0 32px" }}>Select the type of work order you want to create.</p>

            {typesLoading && <p style={{ color: "#555" }}>Loading types...</p>}

            {!typesLoading && activeTypes.length === 0 && (
              <div style={{ padding: "32px", border: "1px dashed #222", borderRadius: "10px", textAlign: "center", color: "#555" }}>
                No active work order types found.{" "}
                <a href="/dashboard/settings/work-order-types" style={{ color: "#f5a623" }}>Configure types in Settings →</a>
              </div>
            )}

            {byCategory.map((cat) => {
              const types = activeTypes.filter((t) => t.category === cat);
              if (types.length === 0) return null;
              return (
                <div key={cat} style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: CATEGORY_COLOR[cat], textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                    {CATEGORY_LABEL[cat]}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {types.map((t) => (
                      <button key={t.id} onClick={() => { setSelectedTypeId(t.id); setStep(2); }}
                        style={{
                          background: "#111", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "18px 20px",
                          cursor: "pointer", textAlign: "left", transition: "border-color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f5a623")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>{t.name}</span>
                          <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "#444" }}>
                            {t.asset_required && <span>Asset required</span>}
                            {t.geography_required && <span>Site required</span>}
                          </div>
                        </div>
                        <p style={{ color: "#555", fontSize: "12px", margin: "4px 0 0" }}>
                          {cat === "corrective" && "Log a fault or breakdown. Records fault description, cause, and resolution."}
                          {cat === "preventive" && "Schedule preventive maintenance with a checklist and recurrence."}
                          {cat === "inspection" && "Conduct an inspection with pass/fail checklist and condition rating."}
                          {cat === "operations" && "Define operational task steps and shift times."}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // ── Step 2: fill form ──────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="work-orders" />
      <main style={{ flex: 1, overflow: "auto", padding: "40px" }}>
        <div style={{ maxWidth: "760px" }}>
          <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "13px", marginBottom: "16px", padding: 0 }}>
            ← Change Type
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: selectedType ? CATEGORY_COLOR[selectedType.category] : "#555", display: "inline-block" }} />
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", color: "#fff", margin: 0 }}>{selectedType?.name}</h1>
              <p style={{ color: "#555", fontSize: "13px", margin: "2px 0 0" }}>{selectedType ? CATEGORY_LABEL[selectedType.category] : ""}</p>
            </div>
          </div>

          {error && <ErrorBanner message={error} />}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Core details */}
            <Section title="Work Order Details">
              <Field label="Title *">
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the work required" />
              </Field>
              <Field label="Description">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Detailed description..." />
              </Field>
              <TwoCol>
                <Field label="Priority">
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </Field>
                <Field label="Assign To">
                  <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Technician or crew name" />
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="Scheduled Date">
                  <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                </Field>
                <Field label="Due Date">
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </Field>
              </TwoCol>
            </Section>

            {/* Geography */}
            <Section title={`Location${selectedType?.geography_required ? " *" : ""}`}
              hint={selectedType?.geography_required ? "A site is required for this work order type." : "Optionally specify where this work is taking place."}>
              <TwoCol>
                <Field label={`Site${selectedType?.geography_required ? " *" : ""}`}>
                  <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required={selectedType?.geography_required}>
                    <option value="">— Select site —</option>
                    {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Location">
                  <select value={locationId} onChange={(e) => setLocationId(e.target.value)} disabled={!siteId}>
                    <option value="">— Select location —</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="Unit">
                  <select value={unitId} onChange={(e) => setUnitId(e.target.value)} disabled={!locationId}>
                    <option value="">— Select unit —</option>
                    {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </Field>
                <Field label="Partition">
                  <select value={partitionId} onChange={(e) => setPartitionId(e.target.value)} disabled={!unitId}>
                    <option value="">— Select partition —</option>
                    {partitions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
              </TwoCol>
            </Section>

            {/* Asset */}
            <Section title={`Asset${selectedType?.asset_required ? " *" : ""}`}
              hint={selectedType?.asset_required ? "An asset is required for this work order type." : "Optionally link this work order to a specific asset."}>
              <Field label={`Asset${selectedType?.asset_required ? " *" : ""}`}>
                <select value={assetId} onChange={(e) => setAssetId(e.target.value)} required={selectedType?.asset_required}>
                  <option value="">— Not asset-specific —</option>
                  {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
              {selectedType?.asset_required && !siteId && (
                <p style={{ fontSize: "12px", color: "#f59e0b", margin: "4px 0 0" }}>⚠ Select a site first to see available assets.</p>
              )}
            </Section>

            {/* Category-specific fields */}
            {selectedType?.category === "corrective" && (
              <Section title="Fault Details">
                <Field label="Fault Description">
                  <textarea value={faultDescription} onChange={(e) => setFaultDescription(e.target.value)} rows={3} placeholder="Describe the fault or breakdown..." />
                </Field>
                <TwoCol>
                  <Field label="Failure Cause">
                    <select value={failureCause} onChange={(e) => setFailureCause(e.target.value)}>
                      <option value="unknown">Unknown</option>
                      <option value="wear">Wear & Tear</option>
                      <option value="damage">Physical Damage</option>
                      <option value="operator_error">Operator Error</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Resolution (if known)">
                    <input value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="How was/will it be resolved?" />
                  </Field>
                </TwoCol>
              </Section>
            )}

            {selectedType?.category === "preventive" && (
              <Section title="Preventive Maintenance">
                <TwoCol>
                  <Field label="Recurrence">
                    <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                      <option value="one_off">One-Off</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </Field>
                  <Field label="Last Serviced Date">
                    <input type="date" value={lastServiced} onChange={(e) => setLastServiced(e.target.value)} />
                  </Field>
                </TwoCol>
                <Field label="PM Checklist">
                  <ChecklistBuilder items={pmItems} onChange={setPmItems} placeholder="e.g. Check oil level" />
                </Field>
              </Section>
            )}

            {selectedType?.category === "inspection" && (
              <Section title="Inspection Details">
                <TwoCol>
                  <Field label="Condition Rating (1–5)">
                    <select value={conditionRating} onChange={(e) => setConditionRating(e.target.value)}>
                      <option value="">Not rated</option>
                      <option value="5">5 — Excellent</option>
                      <option value="4">4 — Good</option>
                      <option value="3">3 — Fair</option>
                      <option value="2">2 — Poor</option>
                      <option value="1">1 — Critical</option>
                    </select>
                  </Field>
                  <Field label="Inspector / Sign-off Name">
                    <input value={signedOffBy} onChange={(e) => setSignedOffBy(e.target.value)} placeholder="Inspector name" />
                  </Field>
                </TwoCol>
                <Field label="Inspection Checklist">
                  <ChecklistBuilder items={inspectionItems} onChange={setInspectionItems} placeholder="e.g. Check fire extinguisher pressure" />
                </Field>
              </Section>
            )}

            {selectedType?.category === "operations" && (
              <Section title="Operations Details">
                <TwoCol>
                  <Field label="Shift Start">
                    <input type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} />
                  </Field>
                  <Field label="Shift End">
                    <input type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} />
                  </Field>
                </TwoCol>
                <Field label="Task Steps">
                  <ChecklistBuilder items={steps} onChange={setSteps} placeholder="e.g. Check all emergency exits" />
                </Field>
              </Section>
            )}

            {/* Notes */}
            <Section title="Additional Notes">
              <Field label="">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any additional notes..." />
              </Field>
            </Section>

            {/* Submit */}
            <div style={{ display: "flex", gap: "12px", paddingBottom: "40px" }}>
              <button type="button" onClick={() => router.push("/dashboard/work-orders")}
                style={{ flex: 1, background: "none", border: "1px solid #222", color: "#555", borderRadius: "8px", padding: "12px", cursor: "pointer", fontSize: "14px" }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                style={{ flex: 2, background: "#f5a623", border: "none", color: "#000", borderRadius: "8px", padding: "12px", cursor: submitting ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 700, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Creating..." : "Create Work Order"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

// ── Shared form primitives ────────────────────────────────────────────────────

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ borderBottom: "1px solid #1a1a1a", paddingBottom: "12px" }}>
        <h3 style={{ color: "#fff", fontSize: "14px", fontWeight: 700, margin: 0 }}>{title}</h3>
        {hint && <p style={{ color: "#555", fontSize: "12px", margin: "4px 0 0" }}>{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#888" }}>
      {label && <span>{label}</span>}
      <style>{`
        .wo-input input, .wo-input textarea, .wo-input select {
          background: #0a0a0a; border: 1px solid #222; color: #fff; border-radius: 6px;
          padding: 9px 12px; font-size: 13px; font-family: 'DM Sans', sans-serif;
          width: 100%; box-sizing: border-box; resize: vertical;
        }
        .wo-input input:focus, .wo-input textarea:focus, .wo-input select:focus { outline: none; border-color: #f5a623; }
        .wo-input input:disabled, .wo-input select:disabled { opacity: 0.4; cursor: not-allowed; }
        .wo-input select option { background: #111; }
      `}</style>
      <div className="wo-input">{children}</div>
    </label>
  );
}

function ChecklistBuilder({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ color: "#444", fontSize: "12px", width: "20px", textAlign: "right", flexShrink: 0 }}>{i + 1}.</span>
          <input
            value={item}
            onChange={(e) => { const next = [...items]; next[i] = e.target.value; onChange(next); }}
            placeholder={placeholder}
            style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", color: "#fff", borderRadius: "6px", padding: "7px 10px", fontSize: "13px" }}
          />
          {items.length > 1 && (
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
              style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "16px", padding: "0 4px" }}>✕</button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ""])}
        style={{ background: "none", border: "1px dashed #222", color: "#555", borderRadius: "6px", padding: "7px", fontSize: "12px", cursor: "pointer", marginTop: "2px" }}>
        + Add item
      </button>
    </div>
  );
}
