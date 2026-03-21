"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import { Asset, AssetFilters, fetchAssets, deleteAsset } from "../models/assets";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useAssets(initialFilters: AssetFilters = {}) {
  const { getToken } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filters, setFilters] = useState<AssetFilters>({ page: 1, page_size: 50, ...initialFilters });
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: AssetFilters) => {
    const token = await getToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAssets(PROJECT_ID, token, f);
      setAssets(data);
      setHasMore(data.length === (f.page_size ?? 50));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load(filters);
  }, [load, filters]);

  function updateFilters(patch: Partial<AssetFilters>) {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  function nextPage() {
    setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }));
  }

  function prevPage() {
    setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }));
  }

  async function handleDelete(id: number) {
    const token = await getToken();
    if (!token) return;
    try {
      await deleteAsset(id, token);
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function reload() {
    await load(filters);
  }

  return {
    assets, filters, loading, error, hasMore,
    updateFilters, nextPage, prevPage,
    handleDelete, reload,
  };
}
