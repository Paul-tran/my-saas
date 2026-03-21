import { apiFetch } from "../api";
import { Document, DocumentRevision, fetchRevisions, getDocumentFileUrl } from "./documents";

export type Pin = {
  id: number;
  document_id: number;
  revision_id: number;
  asset_id: number | null;
  tag: string;
  asset_type: string | null;
  description: string | null;
  x_percent: number;
  y_percent: number;
  page_number: number;
  status: "pending" | "confirmed" | "dismissed";
  created_at: string;
};

export async function fetchDocument(documentId: number, token: string): Promise<Document> {
  return apiFetch(`/api/v1/documents/${documentId}`, token);
}

export async function fetchPins(documentId: number, token: string): Promise<Pin[]> {
  return apiFetch(`/api/v1/documents/${documentId}/pins`, token);
}

export async function analyzeDrawing(documentId: number, page: number, token: string): Promise<Pin[]> {
  return apiFetch(`/api/v1/documents/${documentId}/analyze?page=${page}`, token, {
    method: "POST",
  });
}

export async function confirmPin(
  pinId: number,
  projectId: number,
  siteId: number,
  token: string,
  locationId?: number,
  unitId?: number,
  partitionId?: number,
  parentId?: number,
  subgroupId?: number,
): Promise<Pin> {
  const params = new URLSearchParams({
    project_id: String(projectId),
    site_id: String(siteId),
  });
  if (locationId) params.set("location_id", String(locationId));
  if (unitId) params.set("unit_id", String(unitId));
  if (partitionId) params.set("partition_id", String(partitionId));
  if (parentId) params.set("parent_id", String(parentId));
  if (subgroupId) params.set("subgroup_id", String(subgroupId));
  return apiFetch(`/api/v1/pins/${pinId}/confirm?${params}`, token, { method: "POST" });
}

export async function createPin(
  documentId: number,
  data: {
    revision_id: number;
    tag: string;
    asset_type?: string;
    description?: string;
    x_percent: number;
    y_percent: number;
    page_number: number;
  },
  token: string
): Promise<Pin> {
  return apiFetch(`/api/v1/documents/${documentId}/pins`, token, {
    method: "POST",
    body: JSON.stringify({ document_id: documentId, status: "pending", ...data }),
  });
}

export async function dismissPin(pinId: number, token: string): Promise<Pin> {
  return apiFetch(`/api/v1/pins/${pinId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ status: "dismissed" }),
  });
}

export async function getLatestRevisionUrl(documentId: number, token: string): Promise<string | null> {
  const revisions = await fetchRevisions(documentId, token);
  if (!revisions.length) return null;
  const latest = revisions[revisions.length - 1];
  return getDocumentFileUrl(latest.file_key, token);
}
