"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import {
  Document,
  DocumentRevision,
  fetchDocuments,
  fetchRevisions,
  uploadDocument,
  getDocumentFileUrl,
  deleteDocument,
} from "../models/documents";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useDocuments() {
  const { getToken, userId } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const docs = await fetchDocuments(PROJECT_ID, token);
      setDocuments(docs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(file: File) {
    const token = await getToken();
    if (!token || !userId) return;
    setUploading(true);
    try {
      await uploadDocument(file, PROJECT_ID, userId, token);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function openDocument(documentId: number) {
    const token = await getToken();
    if (!token) return;
    try {
      const revisions = await fetchRevisions(documentId, token);
      if (!revisions.length) return;
      const latest = revisions[revisions.length - 1];
      const url = await getDocumentFileUrl(latest.file_key, token);
      window.open(url, "_blank");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDelete(documentId: number) {
    const token = await getToken();
    if (!token) return;
    try {
      await deleteDocument(documentId, token);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (e: any) {
      setError(e.message);
    }
  }

  return { documents, loading, uploading, error, handleUpload, openDocument, handleDelete };
}
