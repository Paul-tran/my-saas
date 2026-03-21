import { apiFetch } from "../api";
import { WOType } from "./wotypes";

export type WorkOrder = {
  id: number;
  project_id: number;
  wo_type_id: number;
  wo_type: WOType | null;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "assigned" | "in_progress" | "on_hold" | "completed" | "cancelled";
  site_id: number | null;
  location_id: number | null;
  unit_id: number | null;
  partition_id: number | null;
  asset_id: number | null;
  assigned_to: string | null;
  scheduled_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  labour_hours: number | null;
  notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  corrective_detail: CorrectiveDetail | null;
  pm_detail: PMDetail | null;
  inspection_detail: InspectionDetail | null;
  operations_detail: OperationsDetail | null;
};

export type CorrectiveDetail = {
  id: number;
  fault_description: string;
  failure_cause: "wear" | "damage" | "operator_error" | "unknown" | "other";
  resolution: string;
};

export type PMChecklistItem = { id: number; description: string; is_checked: boolean; order_index: number };
export type PMDetail = {
  id: number;
  recurrence: "one_off" | "weekly" | "monthly" | "quarterly" | "annually";
  last_serviced_date: string | null;
  checklist_items: PMChecklistItem[];
};

export type InspectionChecklistItem = { id: number; description: string; result: "pass" | "fail" | "na"; order_index: number };
export type InspectionDetail = {
  id: number;
  condition_rating: number | null;
  signed_off_by: string | null;
  checklist_items: InspectionChecklistItem[];
};

export type OperationsStep = { id: number; description: string; is_completed: boolean; order_index: number };
export type OperationsDetail = {
  id: number;
  shift_start: string | null;
  shift_end: string | null;
  steps: OperationsStep[];
};

export type WOComment = {
  id: number;
  author: string;
  body: string;
  is_system: boolean;
  created_at: string;
};

export type WorkOrderCreate = {
  wo_type_id: number;
  title: string;
  description?: string;
  priority: WorkOrder["priority"];
  site_id?: number;
  location_id?: number;
  unit_id?: number;
  partition_id?: number;
  asset_id?: number;
  assigned_to?: string;
  scheduled_date?: string;
  due_date?: string;
  notes?: string;
  corrective_detail?: Partial<CorrectiveDetail>;
  pm_detail?: Partial<PMDetail> & { checklist_items?: { description: string; order_index: number }[] };
  inspection_detail?: Partial<InspectionDetail> & { checklist_items?: { description: string; order_index: number }[] };
  operations_detail?: Partial<OperationsDetail> & { steps?: { description: string; order_index: number }[] };
};

export type WorkOrderUpdate = Partial<{
  title: string; description: string; priority: WorkOrder["priority"];
  status: WorkOrder["status"]; site_id: number; location_id: number;
  unit_id: number; partition_id: number; asset_id: number;
  assigned_to: string; scheduled_date: string; due_date: string;
  completed_date: string; labour_hours: number; notes: string;
}>;

export const PRIORITY_LABEL: Record<WorkOrder["priority"], string> = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
export const PRIORITY_COLOR: Record<WorkOrder["priority"], string> = { low: "#6b7280", medium: "#3b82f6", high: "#f59e0b", critical: "#ef4444" };
export const STATUS_LABEL: Record<WorkOrder["status"], string> = {
  open: "Open", assigned: "Assigned", in_progress: "In Progress",
  on_hold: "On Hold", completed: "Completed", cancelled: "Cancelled",
};
export const STATUS_COLOR: Record<WorkOrder["status"], string> = {
  open: "#3b82f6", assigned: "#8b5cf6", in_progress: "#f59e0b",
  on_hold: "#6b7280", completed: "#22c55e", cancelled: "#ef4444",
};
export const FAILURE_CAUSE_LABEL: Record<CorrectiveDetail["failure_cause"], string> = {
  wear: "Wear & Tear", damage: "Physical Damage", operator_error: "Operator Error", unknown: "Unknown", other: "Other",
};
export const RECURRENCE_LABEL: Record<PMDetail["recurrence"], string> = {
  one_off: "One-Off", weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", annually: "Annually",
};

export async function fetchWorkOrders(projectId: number, token: string): Promise<WorkOrder[]> {
  return apiFetch(`/api/v1/projects/${projectId}/work-orders`, token);
}

export async function fetchWorkOrder(woId: number, token: string): Promise<WorkOrder> {
  return apiFetch(`/api/v1/work-orders/${woId}`, token);
}

export async function createWorkOrder(projectId: number, data: WorkOrderCreate, token: string): Promise<WorkOrder> {
  return apiFetch(`/api/v1/projects/${projectId}/work-orders`, token, { method: "POST", body: JSON.stringify(data) });
}

export async function updateWorkOrder(woId: number, data: WorkOrderUpdate, token: string): Promise<WorkOrder> {
  return apiFetch(`/api/v1/work-orders/${woId}`, token, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteWorkOrder(woId: number, token: string): Promise<void> {
  await apiFetch(`/api/v1/work-orders/${woId}`, token, { method: "DELETE" });
}

export async function fetchComments(woId: number, token: string): Promise<WOComment[]> {
  return apiFetch(`/api/v1/work-orders/${woId}/comments`, token);
}

export async function addComment(woId: number, body: string, token: string): Promise<WOComment> {
  return apiFetch(`/api/v1/work-orders/${woId}/comments`, token, { method: "POST", body: JSON.stringify({ body }) });
}

export async function updatePMChecklistItem(itemId: number, is_checked: boolean, token: string) {
  return apiFetch(`/api/v1/pm-checklist-items/${itemId}`, token, { method: "PATCH", body: JSON.stringify({ is_checked }) });
}

export async function updateInspectionChecklistItem(itemId: number, result: "pass" | "fail" | "na", token: string) {
  return apiFetch(`/api/v1/inspection-checklist-items/${itemId}`, token, { method: "PATCH", body: JSON.stringify({ result }) });
}

export async function updateOperationsStep(stepId: number, is_completed: boolean, token: string) {
  return apiFetch(`/api/v1/operations-steps/${stepId}`, token, { method: "PATCH", body: JSON.stringify({ is_completed }) });
}

export async function updateCorrectiveDetail(woId: number, data: Partial<CorrectiveDetail>, token: string): Promise<WorkOrder> {
  return apiFetch(`/api/v1/work-orders/${woId}/corrective-detail`, token, { method: "PATCH", body: JSON.stringify(data) });
}

export async function updateInspectionDetail(woId: number, data: Partial<InspectionDetail>, token: string): Promise<WorkOrder> {
  return apiFetch(`/api/v1/work-orders/${woId}/inspection-detail`, token, { method: "PATCH", body: JSON.stringify(data) });
}
