"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Document,
  DocumentRevision,
  DocumentGeoFields,
  fetchDocuments,
  fetchRevisions,
  uploadDocument,
  updateDocument,
  getDocumentFileUrl,
  deleteDocument,
  fetchMyRole,
} from "../models/documents";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

const RESTRICTED_ROLES = new Set(["viewer", "guest"]);

export function useDocuments() {
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  // Default to editable if no member record exists (role system not yet configured)
  const canEdit = myRole ? !RESTRICTED_ROLES.has(myRole) : true;

  const load = useCallback(async () => {
    try {
      const [docs, role] = await Promise.all([
        fetchDocuments(PROJECT_ID, ""),
        fetchMyRole(PROJECT_ID, ""),
      ]);
      setDocuments(docs);
      setMyRole(role);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(file: File, geo: DocumentGeoFields = {}) {
    setUploading(true);
    try {
      await uploadDocument(file, PROJECT_ID, "me", "", geo);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function openDocument(documentId: number) {
    try {
      const revisions = await fetchRevisions(documentId, "");
      if (!revisions.length) return;
      const latest = revisions[revisions.length - 1];
      const url = await getDocumentFileUrl(latest.file_key, "");
      window.open(url, "_blank");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleUpdate(documentId: number, data: Parameters<typeof updateDocument>[1]) {
    try {
      const updated = await updateDocument(documentId, data, "");
      setDocuments((prev) => prev.map((d) => (d.id === documentId ? updated : d)));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDelete(documentId: number) {
    try {
      await deleteDocument(documentId, "");
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (e: any) {
      setError(e.message);
    }
  }

  return { documents, loading, uploading, error, myRole, canEdit, handleUpload, handleUpdate, openDocument, handleDelete };
}
