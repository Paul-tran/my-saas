"use client";

import { useState, useEffect, useCallback } from "react";
import { Document } from "../models/documents";
import {
  Pin,
  fetchDocument,
  fetchPins,
  analyzeDrawing,
  confirmPin,
  dismissPin,
  createPin,
} from "../models/drawings";
import { fetchRevisions, getDocumentFileUrl } from "../models/documents";

const DEFAULT_PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useDrawingViewer(documentId: number, initialPage = 1) {

  const [document, setDocument] = useState<Document | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [latestRevisionId, setLatestRevisionId] = useState<number | null>(null);
  const [pendingPlacement, setPendingPlacement] = useState<{ x_percent: number; y_percent: number } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [doc, revisions, pinsData] = await Promise.all([
        fetchDocument(documentId, ""),
        fetchRevisions(documentId, ""),
        fetchPins(documentId, ""),
      ]);
      setDocument(doc);
      setPins(pinsData);
      if (revisions.length) {
        const latest = revisions[revisions.length - 1];
        setLatestRevisionId(latest.id);
        const url = await getDocumentFileUrl(latest.file_key, "");
        setPdfUrl(url);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [documentId, ]);

  useEffect(() => {
    load();
  }, [load]);

  const pinsForPage = pins.filter((p) => p.page_number === currentPage && p.status !== "dismissed");

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const newPins = await analyzeDrawing(documentId, currentPage, "");
      // Replace existing pending pins for this page with fresh results
      setPins((prev) => [
        ...prev.filter((p) => !(p.page_number === currentPage && p.status === "pending")),
        ...newPins,
      ]);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirm(
    pinId: number,
    siteId: number,
    locationId?: number,
    unitId?: number,
    partitionId?: number,
    parentId?: number,
    subgroupId?: number,
  ) {
    try {
      const updated = await confirmPin(pinId, DEFAULT_PROJECT_ID, siteId, "", locationId, unitId, partitionId, parentId, subgroupId);
      setPins((prev) => prev.map((p) => (p.id === pinId ? updated : p)));
      setSelectedPinId(null);
    } catch (e: any) {
      setActionError(e.message);
    }
  }

  async function handleDismiss(pinId: number) {
    try {
      const updated = await dismissPin(pinId, "");
      setPins((prev) => prev.map((p) => (p.id === pinId ? updated : p)));
      setSelectedPinId(null);
    } catch (e: any) {
      setActionError(e.message);
    }
  }

  async function handleCreatePin(
    tag: string,
    assetType?: string,
    description?: string
  ) {
    if (!pendingPlacement || !latestRevisionId) return;
    try {
      const pin = await createPin(
        documentId,
        {
          revision_id: latestRevisionId,
          tag,
          asset_type: assetType,
          description,
          x_percent: pendingPlacement.x_percent,
          y_percent: pendingPlacement.y_percent,
          page_number: currentPage,
        },
        ""
      );
      setPins((prev) => [...prev, pin]);
      setSelectedPinId(pin.id);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setPendingPlacement(null);
    }
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
    handleCreatePin,
    pendingPlacement,
    setPendingPlacement,
    latestRevisionId,
    actionError,
    setActionError,
  };
}
