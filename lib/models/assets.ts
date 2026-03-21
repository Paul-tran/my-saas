import { apiFetch } from "../api";

export type Asset = {
  id: number;
  project_id: number;
  tag: string;
  name: string | null;
  type: string | null;
  status: string;
  description: string | null;
  site_id: number;
  location_id: number | null;
  unit_id: number | null;
  partition_id: number | null;
  parent_id: number | null;
  subgroup_id: number | null;
  children_count: number;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  supplier: string | null;
  planned_cost: string | null;
  actual_cost: string | null;
  po_number: string | null;
  delivery_date: string | null;
  warranty_expiry: string | null;
  commissioning_status: string;
  created_at: string;
  updated_at: string;
};

export type AssetFilters = {
  search?: string;
  site_id?: number;
  status?: string;
  commissioning_status?: string;
  type?: string;
  parent_id?: number; // 0 = root only
  page?: number;
  page_size?: number;
};

export async function fetchAssets(
  projectId: number,
  token: string,
  filters: AssetFilters = {}
): Promise<Asset[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.site_id) params.set("site_id", String(filters.site_id));
  if (filters.status) params.set("status", filters.status);
  if (filters.commissioning_status) params.set("commissioning_status", filters.commissioning_status);
  if (filters.type) params.set("type", filters.type);
  if (filters.parent_id !== undefined) params.set("parent_id", String(filters.parent_id));
  params.set("page", String(filters.page ?? 1));
  params.set("page_size", String(filters.page_size ?? 50));
  return apiFetch(`/api/v1/projects/${projectId}/assets?${params}`, token);
}

export async function fetchAsset(assetId: number, token: string): Promise<Asset> {
  return apiFetch(`/api/v1/assets/${assetId}`, token);
}

export async function fetchAssetChildren(assetId: number, token: string): Promise<Asset[]> {
  return apiFetch(`/api/v1/assets/${assetId}/children`, token);
}

export async function createAsset(
  projectId: number,
  data: Partial<Asset> & { tag: string; site_id: number },
  token: string
): Promise<Asset> {
  return apiFetch(`/api/v1/projects/${projectId}/assets`, token, {
    method: "POST",
    body: JSON.stringify({ project_id: projectId, ...data }),
  });
}

export async function updateAsset(
  assetId: number,
  data: Partial<Asset>,
  token: string
): Promise<Asset> {
  return apiFetch(`/api/v1/assets/${assetId}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(assetId: number, token: string): Promise<void> {
  return apiFetch(`/api/v1/assets/${assetId}`, token, { method: "DELETE" });
}

export type AssetDrawing = {
  document_id: number;
  document_name: string;
  category: string | null;
  status: string;
  page_number: number;
  pin_id: number;
  x_percent: number;
  y_percent: number;
};

export async function fetchAssetDrawings(assetId: number, token: string): Promise<AssetDrawing[]> {
  return apiFetch(`/api/v1/assets/${assetId}/drawings`, token);
}
