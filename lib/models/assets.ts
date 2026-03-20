import { apiFetch } from "../api";

export type Asset = {
  id: number;
  project_id: number;
  tag: string;
  name: string | null;
  type: string | null;
  status: string;
  site_id: number;
  location_id: number | null;
  commissioning_status: string;
  created_at: string;
  updated_at: string;
};

export type AssetCreate = {
  tag: string;
  name?: string;
  type?: string;
  site_id: number;
  status?: string;
};

export async function fetchAssets(projectId: number, token: string): Promise<Asset[]> {
  return apiFetch(`/api/v1/projects/${projectId}/assets`, token);
}

export async function createAsset(
  projectId: number,
  data: AssetCreate,
  token: string
): Promise<Asset> {
  return apiFetch(`/api/v1/projects/${projectId}/assets`, token, {
    method: "POST",
    body: JSON.stringify({ project_id: projectId, ...data }),
  });
}
