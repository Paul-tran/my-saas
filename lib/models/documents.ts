import { apiFetch, apiUpload } from "../api";

export type Document = {
  id: number;
  project_id: number;
  name: string;
  category: string;
  status: string;
  version: string;
  uploaded_by: string;
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

export async function fetchDocuments(projectId: number, token: string): Promise<Document[]> {
  return apiFetch(`/api/v1/projects/${projectId}/documents`, token);
}

export async function uploadDocument(
  file: File,
  projectId: number,
  uploadedBy: string,
  token: string
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
      category: "General",
      uploaded_by: uploadedBy,
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

export async function getDocumentFileUrl(fileKey: string, token: string): Promise<string> {
  const res = await apiFetch<{ url: string; expires_in: number }>(
    `/api/v1/files/url?file_key=${encodeURIComponent(fileKey)}`,
    token
  );
  return res.url;
}

export async function fetchRevisions(documentId: number, token: string): Promise<DocumentRevision[]> {
  return apiFetch(`/api/v1/documents/${documentId}/revisions`, token);
}

export async function deleteDocument(documentId: number, token: string): Promise<void> {
  await apiFetch(`/api/v1/documents/${documentId}`, token, { method: "DELETE" });
}
