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
  token: string
): Promise<Pin> {
  return apiFetch(
    `/api/v1/pins/${pinId}/confirm?project_id=${projectId}&site_id=${siteId}`,
    token,
    { method: "POST" }
  );
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
