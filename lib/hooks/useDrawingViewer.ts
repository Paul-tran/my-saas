"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import { Document } from "../models/documents";
import {
  Pin,
  fetchDocument,
  fetchPins,
  analyzeDrawing,
  confirmPin,
  dismissPin,
  getLatestRevisionUrl,
} from "../models/drawings";

const DEFAULT_PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useDrawingViewer(documentId: number) {
  const { getToken } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const [doc, url, pinsData] = await Promise.all([
        fetchDocument(documentId, token),
        getLatestRevisionUrl(documentId, token),
        fetchPins(documentId, token),
      ]);
      setDocument(doc);
      setPdfUrl(url);
      setPins(pinsData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [documentId, getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const pinsForPage = pins.filter((p) => p.page_number === currentPage && p.status !== "dismissed");

  async function handleAnalyze() {
    const token = await getToken();
    if (!token) return;
    setAnalyzing(true);
    try {
      const newPins = await analyzeDrawing(documentId, currentPage, token);
      // Replace existing pending pins for this page with fresh results
      setPins((prev) => [
        ...prev.filter((p) => !(p.page_number === currentPage && p.status === "pending")),
        ...newPins,
      ]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirm(pinId: number, siteId: number) {
    const token = await getToken();
    if (!token) return;
    const updated = await confirmPin(pinId, DEFAULT_PROJECT_ID, siteId, token);
    setPins((prev) => prev.map((p) => (p.id === pinId ? updated : p)));
    setSelectedPinId(null);
  }

  async function handleDismiss(pinId: number) {
    const token = await getToken();
    if (!token) return;
    const updated = await dismissPin(pinId, token);
    setPins((prev) => prev.map((p) => (p.id === pinId ? updated : p)));
    setSelectedPinId(null);
  }

  const selectedPin = pins.find((p) => p.id === selectedPinId) ?? null;

  return {
    document,
    pdfUrl,
    pinsForPage,
    selectedPin,
    selectedPinId,
    currentPage,
    analyzing,
    loading,
    error,
    setSelectedPinId,
    setCurrentPage,
    handleAnalyze,
    handleConfirm,
    handleDismiss,
  };
}
