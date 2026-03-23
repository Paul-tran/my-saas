import { apiFetch } from "../api";

export type CommissioningRecord = {
  id: number;
  project_id: number;
  type: string;
  name: string;
  description: string | null;
  assigned_to: string | null;
  overall_status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CommissioningCreate = {
  name: string;
  assigned_to?: string;
  created_by: string;
};

// Maps API status values to display-friendly labels
export const STATUS_LABELS: Record<string, string> = {
  not_started: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  failed: "Failed",
};

export async function fetchCommissioning(
  projectId: number,
  token?: string
): Promise<CommissioningRecord[]> {
  return apiFetch(`/api/v1/projects/${projectId}/commissioning`, token);
}

export async function createCommissioning(
  projectId: number,
  data: CommissioningCreate,
  token?: string
): Promise<CommissioningRecord> {
  return apiFetch(`/api/v1/projects/${projectId}/commissioning`, token, {
    method: "POST",
    body: JSON.stringify({
      project_id: projectId,
      type: "individual",
      overall_status: "not_started",
      ...data,
    }),
  });
}

export async function deleteCommissioning(
  recordId: number,
  token?: string
): Promise<void> {
  await apiFetch(`/api/v1/commissioning/${recordId}`, token, { method: "DELETE" });
}
