"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Sidebar from "../../../components/Sidebar";
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

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { getToken } = useAuth();

  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [comments, setComments] = useState<WOComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [labourHours, setLabourHours] = useState("");

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    try {
      const token = await getToken();
      const [woData, commentData] = await Promise.all([
        fetchWorkOrder(Number(id), token!),
        fetchComments(Number(id), token!),
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
      const token = await getToken();
      const update: any = { status };
      if (status === "completed" && !wo?.completed_date) {
        update.completed_date = new Date().toISOString().split("T")[0];
      }
      const updated = await updateWorkOrder(Number(id), update, token!);
      setWo(updated);
      const newComments = await fetchComments(Number(id), token!);
      setComments(newComments);
    } catch (e: any) { setError(e.message); }
  }

  async function saveLabourHours() {
    if (!labourHours) return;
    try {
      const token = await getToken();
      const updated = await updateWorkOrder(Number(id), { labour_hours: parseFloat(labourHours) }, token!);
      setWo(updated);
    } catch (e: any) { setError(e.message); }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const token = await getToken();
      const comment = await addComment(Number(id), commentText.trim(), token!);
      setComments((prev) => [...prev, comment]);
      setCommentText("");
    } catch (e: any) { setError(e.message); }
    setSubmittingComment(false);
  }

  async function togglePMItem(itemId: number, checked: boolean) {
    try {
      const token = await getToken();
      await updatePMChecklistItem(itemId, !checked, token!);
      const updated = await fetchWorkOrder(Number(id), token!);
      setWo(updated);
    } catch (e: any) { setError(e.message); }
  }

  async function setInspectionResult(itemId: number, result: "pass" | "fail" | "na") {
    try {
      const token = await getToken();
      await updateInspectionChecklistItem(itemId, result, token!);
      const updated = await fetchWorkOrder(Number(id), token!);
      setWo(updated);
    } catch (e: any) { setError(e.message); }
  }

  async function toggleStep(stepId: number, completed: boolean) {
    try {
      const token = await getToken();
      await updateOperationsStep(stepId, !completed, token!);
      const updated = await fetchWorkOrder(Number(id), token!);
      setWo(updated);
    } catch (e: any) { setError(e.message); }
  }

  async function handleDelete() {
    if (!confirm("Delete this work order? This cannot be undone.")) return;
    try {
      const token = await getToken();
      await deleteWorkOrder(Number(id), token!);
      router.push("/dashboard/work-orders");
    } catch (e: any) { setError(e.message); }
  }

  if (loading) return <Shell><p style={{ color: "#555" }}>Loading...</p></Shell>;
  if (error && !wo) return <Shell><ErrorBanner message={error} /></Shell>;
  if (!wo) return <Shell><p style={{ color: "#ef4444" }}>Work order not found.</p></Shell>;

  const category = wo.wo_type?.category;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');`}</style>
      <Sidebar active="work-orders" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "24px 40px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <button onClick={() => router.push("/dashboard/work-orders")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "13px", marginBottom: "12px", padding: 0 }}>
            ← Back to Work Orders
          </button>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "#555" }}>WO #{wo.id}</span>
                {wo.wo_type && (
                  <span style={{ fontSize: "11px", fontWeight: 600, color: CATEGORY_COLOR[wo.wo_type.category], background: CATEGORY_COLOR[wo.wo_type.category] + "1a", padding: "2px 8px", borderRadius: "4px" }}>
                    {wo.wo_type.name}
                  </span>
                )}
                <span style={{ fontSize: "11px", fontWeight: 700, color: PRIORITY_COLOR[wo.priority] }}>
                  {PRIORITY_LABEL[wo.priority].toUpperCase()}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: STATUS_COLOR[wo.status] + "22", color: STATUS_COLOR[wo.status], border: `1px solid ${STATUS_COLOR[wo.status]}44` }}>
                  {STATUS_LABEL[wo.status]}
                </span>
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", color: "#fff", margin: 0 }}>{wo.title}</h1>
              {wo.description && <p style={{ color: "#666", fontSize: "14px", margin: "6px 0 0" }}>{wo.description}</p>}
            </div>
            <button onClick={handleDelete} style={{ background: "none", border: "1px solid #2a1a1a", color: "#ef4444", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", cursor: "pointer", flexShrink: 0 }}>
              Delete
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          {/* Left column */}
          <div style={{ flex: 1, overflow: "auto", padding: "28px 40px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {error && <ErrorBanner message={error} />}

            {/* Details grid */}
            <Card title="Details">
              <Grid>
                <Detail label="Status">
                  <span style={{ color: STATUS_COLOR[wo.status], fontWeight: 600 }}>{STATUS_LABEL[wo.status]}</span>
                </Detail>
                <Detail label="Priority">
                  <span style={{ color: PRIORITY_COLOR[wo.priority], fontWeight: 600 }}>{PRIORITY_LABEL[wo.priority]}</span>
                </Detail>
                {wo.assigned_to && <Detail label="Assigned To">{wo.assigned_to}</Detail>}
                {wo.scheduled_date && <Detail label="Scheduled">{wo.scheduled_date}</Detail>}
                {wo.due_date && <Detail label="Due Date">
                  <span style={{ color: !wo.completed_date && new Date(wo.due_date) < new Date() ? "#ef4444" : "#ccc" }}>{wo.due_date}</span>
                </Detail>}
                {wo.completed_date && <Detail label="Completed">{wo.completed_date}</Detail>}
                <Detail label="Created">{new Date(wo.created_at).toLocaleDateString()}</Detail>
                {wo.labour_hours && <Detail label="Labour Hours">{wo.labour_hours}h</Detail>}
              </Grid>
            </Card>

            {/* Location */}
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

            {/* Corrective details */}
            {category === "corrective" && wo.corrective_detail && (
              <Card title="Fault Details">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Detail label="Failure Cause">{FAILURE_CAUSE_LABEL[wo.corrective_detail.failure_cause as keyof typeof FAILURE_CAUSE_LABEL] ?? wo.corrective_detail.failure_cause}</Detail>
                  {wo.corrective_detail.fault_description && (
                    <Detail label="Fault Description">{wo.corrective_detail.fault_description}</Detail>
                  )}
                  {wo.corrective_detail.resolution && (
                    <Detail label="Resolution">{wo.corrective_detail.resolution}</Detail>
                  )}
                </div>
              </Card>
            )}

            {/* PM details */}
            {category === "preventive" && wo.pm_detail && (
              <Card title="Preventive Maintenance">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Grid>
                    <Detail label="Recurrence">{RECURRENCE_LABEL[wo.pm_detail.recurrence as keyof typeof RECURRENCE_LABEL]}</Detail>
                    {wo.pm_detail.last_serviced_date && <Detail label="Last Serviced">{wo.pm_detail.last_serviced_date}</Detail>}
                  </Grid>
                  {wo.pm_detail.checklist_items.length > 0 && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                        Checklist ({wo.pm_detail.checklist_items.filter((i) => i.is_checked).length}/{wo.pm_detail.checklist_items.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {wo.pm_detail.checklist_items.sort((a, b) => a.order_index - b.order_index).map((item) => (
                          <div key={item.id} onClick={() => togglePMItem(item.id, item.is_checked)}
                            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#0a0a0a", borderRadius: "6px", cursor: "pointer" }}>
                            <span style={{ width: "16px", height: "16px", borderRadius: "4px", border: `2px solid ${item.is_checked ? "#22c55e" : "#333"}`, background: item.is_checked ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {item.is_checked && <span style={{ color: "#000", fontSize: "10px", fontWeight: 700 }}>✓</span>}
                            </span>
                            <span style={{ fontSize: "13px", color: item.is_checked ? "#555" : "#ccc", textDecoration: item.is_checked ? "line-through" : "none" }}>{item.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Inspection details */}
            {category === "inspection" && wo.inspection_detail && (
              <Card title="Inspection">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Grid>
                    {wo.inspection_detail.condition_rating && (
                      <Detail label="Condition Rating">
                        <span style={{ color: wo.inspection_detail.condition_rating >= 4 ? "#22c55e" : wo.inspection_detail.condition_rating >= 3 ? "#f59e0b" : "#ef4444" }}>
                          {"★".repeat(wo.inspection_detail.condition_rating)}{"☆".repeat(5 - wo.inspection_detail.condition_rating)} ({wo.inspection_detail.condition_rating}/5)
                        </span>
                      </Detail>
                    )}
                    {wo.inspection_detail.signed_off_by && <Detail label="Signed Off By">{wo.inspection_detail.signed_off_by}</Detail>}
                  </Grid>
                  {wo.inspection_detail.checklist_items.length > 0 && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Checklist</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {wo.inspection_detail.checklist_items.sort((a, b) => a.order_index - b.order_index).map((item) => (
                          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#0a0a0a", borderRadius: "6px" }}>
                            <span style={{ flex: 1, fontSize: "13px", color: "#ccc" }}>{item.description}</span>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {(["pass", "fail", "na"] as const).map((r) => (
                                <button key={r} onClick={() => setInspectionResult(item.id, r)}
                                  style={{
                                    padding: "3px 8px", borderRadius: "4px", border: "1px solid", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                                    borderColor: item.result === r ? (r === "pass" ? "#22c55e" : r === "fail" ? "#ef4444" : "#6b7280") : "#222",
                                    background: item.result === r ? (r === "pass" ? "#22c55e22" : r === "fail" ? "#ef444422" : "#6b728022") : "transparent",
                                    color: item.result === r ? (r === "pass" ? "#22c55e" : r === "fail" ? "#ef4444" : "#6b7280") : "#444",
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

            {/* Operations details */}
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
                      <div style={{ fontSize: "11px", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                        Task Steps ({wo.operations_detail.steps.filter((s) => s.is_completed).length}/{wo.operations_detail.steps.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {wo.operations_detail.steps.sort((a, b) => a.order_index - b.order_index).map((step, i) => (
                          <div key={step.id} onClick={() => toggleStep(step.id, step.is_completed)}
                            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#0a0a0a", borderRadius: "6px", cursor: "pointer" }}>
                            <span style={{ color: "#444", fontSize: "12px", width: "20px", textAlign: "right", flexShrink: 0 }}>{i + 1}.</span>
                            <span style={{ width: "16px", height: "16px", borderRadius: "4px", border: `2px solid ${step.is_completed ? "#22c55e" : "#333"}`, background: step.is_completed ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {step.is_completed && <span style={{ color: "#000", fontSize: "10px", fontWeight: 700 }}>✓</span>}
                            </span>
                            <span style={{ fontSize: "13px", color: step.is_completed ? "#555" : "#ccc", textDecoration: step.is_completed ? "line-through" : "none" }}>{step.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Notes */}
            {wo.notes && (
              <Card title="Notes">
                <p style={{ color: "#888", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>{wo.notes}</p>
              </Card>
            )}
          </div>

          {/* Right column — actions + activity log */}
          <div style={{ width: "340px", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
            {/* Status transitions */}
            <div style={{ padding: "20px", borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: "11px", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Update Status</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {STATUSES.filter((s) => s !== wo.status).map((s) => (
                  <button key={s} onClick={() => changeStatus(s)}
                    style={{ background: STATUS_COLOR[s] + "1a", border: `1px solid ${STATUS_COLOR[s]}33`, color: STATUS_COLOR[s], borderRadius: "6px", padding: "8px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                    → {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Labour hours */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: "11px", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Labour Hours</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="number" min="0" step="0.5" value={labourHours} onChange={(e) => setLabourHours(e.target.value)} placeholder="0.0"
                  style={{ flex: 1, background: "#0a0a0a", border: "1px solid #222", color: "#fff", borderRadius: "6px", padding: "7px 10px", fontSize: "13px" }} />
                <button onClick={saveLabourHours}
                  style={{ background: "#1a1a1a", border: "1px solid #333", color: "#ccc", borderRadius: "6px", padding: "7px 12px", fontSize: "12px", cursor: "pointer" }}>
                  Save
                </button>
              </div>
            </div>

            {/* Activity log */}
            <div style={{ fontSize: "11px", color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", padding: "16px 20px 8px", flexShrink: 0 }}>
              Activity Log
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "0 20px" }}>
              {comments.length === 0 && (
                <p style={{ color: "#333", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No activity yet.</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "16px" }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ padding: "10px 12px", background: c.is_system ? "transparent" : "#111", borderRadius: "6px", border: c.is_system ? "none" : "1px solid #1a1a1a", borderLeft: c.is_system ? "2px solid #333" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: c.is_system ? "#444" : "#888", fontStyle: c.is_system ? "italic" : "normal" }}>
                        {c.is_system ? "System" : c.author}
                      </span>
                      <span style={{ fontSize: "11px", color: "#333" }}>{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: c.is_system ? "#555" : "#ccc", margin: 0, lineHeight: "1.4" }}>{c.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Add comment */}
            <form onSubmit={submitComment} style={{ padding: "12px 20px", borderTop: "1px solid #1a1a1a", flexShrink: 0 }}>
              <textarea
                value={commentText} onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                style={{ width: "100%", background: "#0a0a0a", border: "1px solid #222", color: "#fff", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", resize: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
              />
              <button type="submit" disabled={submittingComment || !commentText.trim()}
                style={{ marginTop: "8px", width: "100%", background: commentText.trim() ? "#f5a623" : "#1a1a1a", border: "none", color: commentText.trim() ? "#000" : "#444", borderRadius: "6px", padding: "8px", fontSize: "13px", fontWeight: 600, cursor: commentText.trim() ? "pointer" : "not-allowed" }}>
                {submittingComment ? "Posting..." : "Post Comment"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar active="work-orders" />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</main>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "20px" }}>
      <h3 style={{ color: "#fff", fontSize: "13px", fontWeight: 700, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
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
      <div style={{ fontSize: "11px", color: "#555", marginBottom: "3px" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "#ccc" }}>{children}</div>
    </div>
  );
}
