import { apiFetch } from "@/lib/api";

export type PMFrequency = "weekly" | "monthly" | "quarterly" | "annually" | "custom_days";

export interface PMActivity {
  id: number;
  name: string;
  wo_type_id: number | null;
  frequency: PMFrequency;
  interval_days: number | null;
  end_date: string | null;
  description: string;
  next_due_date: string | null;
  last_generated_date: string | null;
  generated_wo_count: number;
  created_at: string;
}

export interface PMSchedule {
  id: number;
  project_id: number;
  name: string;
  asset_id: number | null;
  site_id: number | null;
  location_id: number | null;
  unit_id: number | null;
  partition_id: number | null;
  assigned_to: string | null;
  lead_days: number;
  start_date: string;
  is_active: boolean;
  activities: PMActivity[];
  created_at: string;
  updated_at: string;
}

export interface PMScheduleCreate {
  name: string;
  asset_id?: number | null;
  site_id?: number | null;
  location_id?: number | null;
  unit_id?: number | null;
  partition_id?: number | null;
  assigned_to?: string | null;
  lead_days: number;
  start_date: string;
  is_active: boolean;
  activities: PMActivityCreate[];
}

export interface PMActivityCreate {
  name: string;
  wo_type_id?: number | null;
  frequency: PMFrequency;
  interval_days?: number | null;
  end_date?: string | null;
  description?: string;
}

export interface PMHistoryEntry {
  id: number;
  title: string;
  status: string;
  due_date: string | null;
  completed_date: string | null;
  assigned_to: string | null;
  activity_name: string | null;
}

const PROJECT_ID = process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || "1";

export async function fetchPMSchedules(): Promise<PMSchedule[]> {
  return apiFetch(`/api/v1/projects/${PROJECT_ID}/pm-schedules`);
}

export async function createPMSchedule(data: PMScheduleCreate): Promise<PMSchedule> {
  return apiFetch(`/api/v1/projects/${PROJECT_ID}/pm-schedules`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePMSchedule(id: number, data: Partial<PMScheduleCreate>): Promise<PMSchedule> {
  return apiFetch(`/api/v1/pm-schedules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePMSchedule(id: number): Promise<void> {
  return apiFetch(`/api/v1/pm-schedules/${id}`, { method: "DELETE" });
}

export async function addPMActivity(scheduleId: number, data: PMActivityCreate): Promise<PMActivity> {
  return apiFetch(`/api/v1/pm-schedules/${scheduleId}/activities`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePMActivity(scheduleId: number, activityId: number, data: Partial<PMActivityCreate>): Promise<PMActivity> {
  return apiFetch(`/api/v1/pm-schedules/${scheduleId}/activities/${activityId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePMActivity(scheduleId: number, activityId: number): Promise<void> {
  return apiFetch(`/api/v1/pm-schedules/${scheduleId}/activities/${activityId}`, { method: "DELETE" });
}

export async function generateWorkOrders(scheduleId: number): Promise<{ generated: number; work_order_ids: number[] }> {
  return apiFetch(`/api/v1/pm-schedules/${scheduleId}/generate`, { method: "POST" });
}

export async function fetchScheduleHistory(scheduleId: number): Promise<PMHistoryEntry[]> {
  return apiFetch(`/api/v1/pm-schedules/${scheduleId}/history`);
}
