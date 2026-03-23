"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ErrorBanner from "../../../components/ErrorBanner";
import {
  WorkOrder, WOComment,
  fetchWorkOrder, updateWorkOrder, deleteWorkOrder,
  fetchComments, addComment,
  updatePMChecklistItem, updateInspectionChecklistItem, updateOperationsStep,
  updateCorrectiveDetail, updateInspectionDetail,
  PRIORITY_COLOR, PRIORITY_LABEL, STATUS_COLOR, STATUS_LABEL,
  FAILURE_CAUSE_LABEL, RECURRENCE_LABEL,
} from "../../../../lib/models/workorders";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "../../../../lib/models/wotypes";

const STATUSES: WorkOrder["status"][] = ["open", "assigned", "in_progress", "on_hold", "completed", "cancelled"];

// Light-theme status badge styles
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  open:        { bg: "#dbeafe", color: "#1d4ed8" },
  assigned:    { bg: "#f3f4f5", color: "#524534" },
  in_progress: { bg: "#fef9c3", color: "#a16207" },
  on_hold:     { bg: "#f3f4f5", color: "#524534" },
  completed:   { bg: "#dcfce7", color: "#15803d" },
  cancelled:   { bg: "#fee2e2", color: "#dc2626" },
};

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();

  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [comments, setComments] = useState<WOComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [labourHours, setLabourHours] = useState("");

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const [woData, commentData] = await Promise.all([
        fetchWorkOrder(Number(id), ""),
        fetchComments(Number(id), ""),
      ]);
      setWo(woData);
      setLabourHours(woData.labour_hours?.toString() ?? "");
      setComments(commentData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(status: WorkOrder["status"]) {
    try {
      const update: any = { status };
      if (status === "completed" && !wo?.completed_date) {
        update.completed_date = new Date().toISOString().split("T")[0];
      }
      const updated = await updateWorkOrder(Number(id), update, "");
      setWo(updated);
      const newComments = await fetchComments(Number(id), "");
      setComments(newComments);
    } catch (e: any) { setError(e.message); }
  }

  async function saveLabourHours() {
    if (!labourHours) return;
    try {
      const updated = await updateWorkOrder(Number(id), { labour_hours: parseFloat(labourHours) }, "");
      setWo(updated);
    } catch (e: any) { setError(e.message); }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const comment = await addComment(Number(id), commentText.trim(), "");
      setComments((prev) => [...prev, comment]);
      setCommentText("");
    } catch (e: any) { setError(e.message); }
    setSubmittingComment(false);
  }

  async function togglePMItem(itemId: number, checked: boolean) {
    try {
      await updatePMChecklistItem(itemId, !checked, "");
      const updated = await fetchWorkOrder(Number(id), "");
      setWo(updated);
    } catch (e: any) { setError(e.message); }
  }

  async function setInspectionResult(itemId: number, result: "pass" | "fail" | "na") {
    try {
      await updateInspectionChecklistItem(itemId, result, "");
      const updated = await fetchWorkOrder(Number(id), "");
      setWo(updated);
    } catch (e: any) { setError(e.message); }
  }

  async function toggleStep(stepId: number, completed: boolean) {
    try {
      await updateOperationsStep(stepId, !completed, "");
      const updated = await fetchWorkOrder(Number(id), "");
      setWo(updated);
    } catch (e: any) { setError(e.message); }
  }

  async function handleDelete() {
    if (!confirm("Delete this work order? This cannot be undone.")) return;
    try {
      await deleteWorkOrder(Number(id), "");
      router.push("/dashboard/work-orders");
    } catch (e: any) { setError(e.message); }
  }

  if (loading) return <Shell><p style={{ color: "#857462" }}>Loading...</p></Shell>;
  if (error && !wo) return <Shell><ErrorBanner message={error} /></Shell>;
  if (!wo) return <Shell><p style={{ color: "#dc2626" }}>Work order not found.</p></Shell>;

  const category = wo.wo_type?.category;
  const statusStyle = STATUS_STYLE[wo.status] ?? { bg: "#f3f4f5", color: "#524534" };

  return (
    <main style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "24px 40px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(215,195,174,0.2)", flexShrink: 0 }}>
          <button onClick={() => router.push("/dashboard/work-orders")} style={{ background: "none", border: "none", color: "#857462", cursor: "pointer", fontSize: "13px", marginBottom: "12px", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span> Back to Work Orders
          </button>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#857462" }}>WO #{wo.id}</span>
                {wo.wo_type && (
                  <span style={{ fontSize: "11px", fontWeight: 600, color: CATEGORY_COLOR[wo.wo_type.category], background: CATEGORY_COLOR[wo.wo_type.category] + "1a", padding: "2px 8px", borderRadius: "4px" }}>
                    {wo.wo_type.name}
                  </span>
                )}
                <span style={{ fontSize: "11px", fontWeight: 700, color: PRIORITY_COLOR[wo.priority] }}>
                  {PRIORITY_LABEL[wo.priority].toUpperCase()}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: statusStyle.bg, color: statusStyle.color }}>
                  {STATUS_LABEL[wo.status]}
                </span>
              </div>
              <h1 style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", fontSize: "24px", fontWeight: 800, color: "#191c1d", margin: 0, letterSpacing: "-0.02em" }}>{wo.title}</h1>
              {wo.description && <p style={{ color: "#524534", fontSize: "14px", margin: "6px 0 0" }}>{wo.description}</p>}
            </div>
            <button onClick={handleDelete} style={{ background: "none", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", cursor: "pointer", flexShrink: 0 }}>
              Delete
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          {/* Left column */}
          <div style={{ flex: 1, overflow: "auto", padding: "24px 40px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && <ErrorBanner message={error} />}

            <Card title="Details">
              <Grid>
                <Detail label="Status">
                  <span style={{ color: statusStyle.color, fontWeight: 600 }}>{STATUS_LABEL[wo.status]}</span>
                </Detail>
                <Detail label="Priority">
                  <span style={{ color: PRIORITY_COLOR[wo.priority], fontWeight: 600 }}>{PRIORITY_LABEL[wo.priority]}</span>
                </Detail>
                {wo.assigned_to && <Detail label="Assigned To">{wo.assigned_to}</Detail>}
                {wo.scheduled_date && <Detail label="Scheduled">{wo.scheduled_date}</Detail>}
                {wo.due_date && (
                  <Detail label="Due Date">
                    <span style={{ color: !wo.completed_date && new Date(wo.due_date) < new Date() ? "#dc2626" : "#191c1d" }}>{wo.due_date}</span>
                  </Detail>
                )}
                {wo.completed_date && <Detail label="Completed">{wo.completed_date}</Detail>}
                <Detail label="Created">{new Date(wo.created_at).toLocaleDateString()}</Detail>
                {wo.labour_hours && <Detail label="Labour Hours">{wo.labour_hours}h</Detail>}
              </Grid>
            </Card>

            {(wo.site_id || wo.asset_id) && (
              <Card title="Location & Asset">
                <Grid>
                  {wo.site_id && <Detail label="Site">Site #{wo.site_id}</Detail>}
                  {wo.location_id && <Detail label="Location">Location #{wo.location_id}</Detail>}
                  {wo.unit_id && <Detail label="Unit">Unit #{wo.unit_id}</Detail>}
                  {wo.partition_id && <Detail label="Partition">Partition #{wo.partition_id}</Detail>}
                  {wo.asset_id && <Detail label="Asset">Asset #{wo.asset_id}</Detail>}
                </Grid>
              </Card>
            )}

            {category === "corrective" && wo.corrective_detail && (
              <Card title="Fault Details">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Detail label="Failure Cause">{FAILURE_CAUSE_LABEL[wo.corrective_detail.failure_cause as keyof typeof FAILURE_CAUSE_LABEL] ?? wo.corrective_detail.failure_cause}</Detail>
                  {wo.corrective_detail.fault_description && <Detail label="Fault Description">{wo.corrective_detail.fault_description}</Detail>}
                  {wo.corrective_detail.resolution && <Detail label="Resolution">{wo.corrective_detail.resolution}</Detail>}
                </div>
              </Card>
            )}

            {category === "preventive" && wo.pm_detail && (
              <Card title="Preventive Maintenance">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Grid>
                    <Detail label="Recurrence">{RECURRENCE_LABEL[wo.pm_detail.recurrence as keyof typeof RECURRENCE_LABEL]}</Detail>
                    {wo.pm_detail.last_serviced_date && <Detail label="Last Serviced">{wo.pm_detail.last_serviced_date}</Detail>}
                  </Grid>
                  {wo.pm_detail.checklist_items.length > 0 && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#857462", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                        Checklist ({wo.pm_detail.checklist_items.filter((i) => i.is_checked).length}/{wo.pm_detail.checklist_items.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {wo.pm_detail.checklist_items.sort((a, b) => a.order_index - b.order_index).map((item) => (
                          <div key={item.id} onClick={() => togglePMItem(item.id, item.is_checked)}
                            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#f3f4f5", borderRadius: "6px", cursor: "pointer" }}>
                            <span style={{ width: "16px", height: "16px", borderRadius: "4px", border: `2px solid ${item.is_checked ? "#15803d" : "#d7c3ae"}`, background: item.is_checked ? "#15803d" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {item.is_checked && <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700 }}>✓</span>}
                            </span>
                            <span style={{ fontSize: "13px", color: item.is_checked ? "#857462" : "#191c1d", textDecoration: item.is_checked ? "line-through" : "none" }}>{item.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {category === "inspection" && wo.inspection_detail && (
              <Card title="Inspection">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Grid>
                    {wo.inspection_detail.condition_rating && (
                      <Detail label="Condition Rating">
                        <span style={{ color: wo.inspection_detail.condition_rating >= 4 ? "#15803d" : wo.inspection_detail.condition_rating >= 3 ? "#a16207" : "#dc2626" }}>
                          {"★".repeat(wo.inspection_detail.condition_rating)}{"☆".repeat(5 - wo.inspection_detail.condition_rating)} ({wo.inspection_detail.condition_rating}/5)
                        </span>
                      </Detail>
                    )}
                    {wo.inspection_detail.signed_off_by && <Detail label="Signed Off By">{wo.inspection_detail.signed_off_by}</Detail>}
                  </Grid>
                  {wo.inspection_detail.checklist_items.length > 0 && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#857462", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Checklist</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {wo.inspection_detail.checklist_items.sort((a, b) => a.order_index - b.order_index).map((item) => (
                          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#f3f4f5", borderRadius: "6px" }}>
                            <span style={{ flex: 1, fontSize: "13px", color: "#191c1d" }}>{item.description}</span>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {(["pass", "fail", "na"] as const).map((r) => (
                                <button key={r} onClick={() => setInspectionResult(item.id, r)}
                                  style={{
                                    padding: "3px 8px", borderRadius: "4px", border: "1px solid", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                                    borderColor: item.result === r ? (r === "pass" ? "#15803d" : r === "fail" ? "#dc2626" : "#857462") : "rgba(215,195,174,0.3)",
                                    background: item.result === r ? (r === "pass" ? "#dcfce7" : r === "fail" ? "#fee2e2" : "#f3f4f5") : "transparent",
                                    color: item.result === r ? (r === "pass" ? "#15803d" : r === "fail" ? "#dc2626" : "#857462") : "#857462",
                                  }}>
                                  {r === "na" ? "N/A" : r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {category === "operations" && wo.operations_detail && (
              <Card title="Operations">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {(wo.operations_detail.shift_start || wo.operations_detail.shift_end) && (
                    <Grid>
                      {wo.operations_detail.shift_start && <Detail label="Shift Start">{wo.operations_detail.shift_start}</Detail>}
                      {wo.operations_detail.shift_end && <Detail label="Shift End">{wo.operations_detail.shift_end}</Detail>}
                    </Grid>
                  )}
                  {wo.operations_detail.steps.length > 0 && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#857462", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                        Task Steps ({wo.operations_detail.steps.filter((s) => s.is_completed).length}/{wo.operations_detail.steps.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {wo.operations_detail.steps.sort((a, b) => a.order_index - b.order_index).map((step, i) => (
                          <div key={step.id} onClick={() => toggleStep(step.id, step.is_completed)}
                            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#f3f4f5", borderRadius: "6px", cursor: "pointer" }}>
                            <span style={{ color: "#857462", fontSize: "12px", width: "20px", textAlign: "right", flexShrink: 0 }}>{i + 1}.</span>
                            <span style={{ width: "16px", height: "16px", borderRadius: "4px", border: `2px solid ${step.is_completed ? "#15803d" : "#d7c3ae"}`, background: step.is_completed ? "#15803d" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {step.is_completed && <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700 }}>✓</span>}
                            </span>
                            <span style={{ fontSize: "13px", color: step.is_completed ? "#857462" : "#191c1d", textDecoration: step.is_completed ? "line-through" : "none" }}>{step.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {wo.notes && (
              <Card title="Notes">
                <p style={{ color: "#524534", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>{wo.notes}</p>
              </Card>
            )}
          </div>

          {/* Right column — actions + activity log */}
          <div style={{ width: "320px", borderLeft: "1px solid rgba(215,195,174,0.2)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, background: "#fff" }}>
            {/* Status transitions */}
            <div style={{ padding: "20px", borderBottom: "1px solid rgba(215,195,174,0.15)" }}>
              <div style={{ fontSize: "11px", color: "#857462", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Update Status</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {STATUSES.filter((s) => s !== wo.status).map((s) => {
                  const ss = STATUS_STYLE[s] ?? { bg: "#f3f4f5", color: "#524534" };
                  return (
                    <button key={s} onClick={() => changeStatus(s)}
                      style={{ background: ss.bg, border: "none", color: ss.color, borderRadius: "6px", padding: "8px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                      → {STATUS_LABEL[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Labour hours */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(215,195,174,0.15)" }}>
              <div style={{ fontSize: "11px", color: "#857462", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Labour Hours</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="number" min="0" step="0.5" value={labourHours} onChange={(e) => setLabourHours(e.target.value)} placeholder="0.0"
                  style={{ flex: 1, background: "#f3f4f5", border: "none", color: "#191c1d", borderRadius: "6px", padding: "7px 10px", fontSize: "13px", outline: "none" }} />
                <button onClick={saveLabourHours}
                  style={{ background: "#f3f4f5", border: "none", color: "#524534", borderRadius: "6px", padding: "7px 12px", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}>
                  Save
                </button>
              </div>
            </div>

            {/* Activity log */}
            <div style={{ fontSize: "11px", color: "#857462", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "16px 20px 8px", flexShrink: 0 }}>
              Activity Log
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "0 20px" }}>
              {comments.length === 0 && (
                <p style={{ color: "#d7c3ae", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No activity yet.</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "16px" }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ padding: "10px 12px", background: c.is_system ? "transparent" : "#f8f9fa", borderRadius: "6px", border: c.is_system ? "none" : "none", borderLeft: c.is_system ? "2px solid #d7c3ae" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: c.is_system ? "#d7c3ae" : "#857462", fontStyle: c.is_system ? "italic" : "normal" }}>
                        {c.is_system ? "System" : c.author}
                      </span>
                      <span style={{ fontSize: "11px", color: "#d7c3ae" }}>{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: c.is_system ? "#857462" : "#191c1d", margin: 0, lineHeight: "1.4" }}>{c.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Add comment */}
            <form onSubmit={submitComment} style={{ padding: "12px 20px", borderTop: "1px solid rgba(215,195,174,0.15)", flexShrink: 0 }}>
              <textarea
                value={commentText} onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                style={{ width: "100%", background: "#f3f4f5", border: "none", color: "#191c1d", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", resize: "none", boxSizing: "border-box", outline: "none", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
              />
              <button type="submit" disabled={submittingComment || !commentText.trim()}
                style={{ marginTop: "8px", width: "100%", background: commentText.trim() ? "linear-gradient(135deg, #835500, #f5a623)" : "#f3f4f5", border: "none", color: commentText.trim() ? "#fff" : "#d7c3ae", borderRadius: "6px", padding: "8px", fontSize: "13px", fontWeight: 600, cursor: commentText.trim() ? "pointer" : "not-allowed" }}>
                {submittingComment ? "Posting..." : "Post Comment"}
              </button>
            </form>
          </div>
        </div>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(215,195,174,0.2)", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 8px rgba(25,28,29,0.04)" }}>
      <h3 style={{ color: "#191c1d", fontSize: "12px", fontWeight: 700, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>{children}</div>;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11px", color: "#857462", marginBottom: "3px" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "#191c1d" }}>{children}</div>
    </div>
  );
}
