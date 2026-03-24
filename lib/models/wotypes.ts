import { apiFetch } from "../api";

export const GEO_LEVELS = ["site", "location", "unit", "partition"] as const;
export type GeoLevel = typeof GEO_LEVELS[number];

export const GEO_LEVEL_LABEL: Record<GeoLevel, string> = {
  site: "Site",
  location: "Location",
  unit: "Unit",
  partition: "Partition",
};

export type WOType = {
  id: number;
  project_id: number;
  name: string;
  category: "corrective" | "preventive" | "inspection" | "operations";
  asset_required: boolean;
  geography_levels_required: GeoLevel[];
  is_active: boolean;
  created_at: string;
};

export type WOTypeCreate = {
  name: string;
  category: WOType["category"];
  asset_required: boolean;
  geography_levels_required: GeoLevel[];
};

export type WOTypeUpdate = Partial<WOTypeCreate & { is_active: boolean }>;

export const CATEGORY_LABEL: Record<WOType["category"], string> = {
  corrective: "Corrective Maintenance",
  preventive: "Preventive Maintenance",
  inspection: "Inspection",
  operations: "Operations",
};

export const CATEGORY_COLOR: Record<WOType["category"], string> = {
  corrective: "#ef4444",
  preventive: "#3b82f6",
  inspection: "#8b5cf6",
  operations: "#f59e0b",
};

export async function fetchWOTypes(projectId: number, token?: string): Promise<WOType[]> {
  return apiFetch(`/api/v1/projects/${projectId}/wo-types`, token);
}

export async function createWOType(projectId: number, data: WOTypeCreate, token?: string): Promise<WOType> {
  return apiFetch(`/api/v1/projects/${projectId}/wo-types`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateWOType(typeId: number, data: WOTypeUpdate, token?: string): Promise<WOType> {
  return apiFetch(`/api/v1/wo-types/${typeId}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteWOType(typeId: number, token?: string): Promise<void> {
  await apiFetch(`/api/v1/wo-types/${typeId}`, token, { method: "DELETE" });
}
