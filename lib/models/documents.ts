import { apiFetch, apiUpload } from "../api";

export type Document = {
  id: number;
  project_id: number;
  name: string;
  category: string;
  status: string;
  version: string;
  uploaded_by: string;
  site_id: number | null;
  location_id: number | null;
  unit_id: number | null;
  partition_id: number | null;
  site_name: string | null;
  location_name: string | null;
  unit_name: string | null;
  partition_name: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentRevision = {
  id: number;
  document_id: number;
  version: string;
  file_key: string;
  file_name: string;
  file_size: number | null;
  status: string;
  uploaded_by: string;
  created_at: string;
};

export async function fetchDocuments(projectId: number, token?: string): Promise<Document[]> {
  return apiFetch(`/api/v1/projects/${projectId}/documents`, token);
}

export type DocumentGeoFields = {
  site_id?: number;
  location_id?: number;
  unit_id?: number;
  partition_id?: number;
  category?: string;
};

export async function uploadDocument(
  file: File,
  projectId: number,
  uploadedBy: string,
  token?: string,
  geo: DocumentGeoFields = {}
): Promise<Document> {
  // Step 1: upload the file to storage
  const formData = new FormData();
  formData.append("file", file);

  const uploaded = await apiUpload<{ file_key: string; file_name: string; file_size: number }>(
    `/api/v1/files/upload?module=documents&project_id=${projectId}`,
    token,
    formData
  );

  // Step 2: create the document record
  const doc = await apiFetch<Document>(`/api/v1/projects/${projectId}/documents`, token, {
    method: "POST",
    body: JSON.stringify({
      project_id: projectId,
      name: file.name,
      category: geo.category || "General",
      uploaded_by: uploadedBy,
      site_id: geo.site_id ?? null,
      location_id: geo.location_id ?? null,
      unit_id: geo.unit_id ?? null,
      partition_id: geo.partition_id ?? null,
    }),
  });

  // Step 3: create the first revision linking the file
  await apiFetch(`/api/v1/documents/${doc.id}/revisions`, token, {
    method: "POST",
    body: JSON.stringify({
      document_id: doc.id,
      version: "v1.0",
      file_key: uploaded.file_key,
      file_name: uploaded.file_name,
      file_size: uploaded.file_size,
      uploaded_by: uploadedBy,
    }),
  });

  return doc;
}

export async function getDocumentFileUrl(fileKey: string, token?: string): Promise<string> {
  const res = await apiFetch<{ url: string; expires_in: number }>(
    `/api/v1/files/url?file_key=${encodeURIComponent(fileKey)}`,
    token
  );
  return res.url;
}

export async function fetchRevisions(documentId: number, token?: string): Promise<DocumentRevision[]> {
  return apiFetch(`/api/v1/documents/${documentId}/revisions`, token);
}

export async function updateDocument(
  documentId: number,
  data: {
    name?: string;
    category?: string;
    status?: string;
    version?: string;
    site_id?: number | null;
    location_id?: number | null;
    unit_id?: number | null;
    partition_id?: number | null;
  },
  token?: string
): Promise<Document> {
  return apiFetch(`/api/v1/documents/${documentId}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteDocument(documentId: number, token?: string): Promise<void> {
  await apiFetch(`/api/v1/documents/${documentId}`, token, { method: "DELETE" });
}

export async function fetchMyRole(projectId: number, token?: string): Promise<string | null> {
  try {
    const res = await apiFetch<{ role: string | null }>(`/api/v1/projects/${projectId}/members/me`, token);
    return res.role;
  } catch {
    return null;
  }
}

export interface MyPermissions {
  is_admin: boolean;
  permissions: Record<string, Record<string, boolean>>;
}

export async function fetchMyPermissions(projectId: number): Promise<MyPermissions> {
  try {
    return await apiFetch<MyPermissions>(`/api/v1/projects/${projectId}/my-permissions`);
  } catch {
    return { is_admin: false, permissions: {} };
  }
}
