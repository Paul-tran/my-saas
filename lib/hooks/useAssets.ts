"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import { Asset, AssetCreate, fetchAssets, createAsset } from "../models/assets";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useAssets() {
  const { getToken } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const data = await fetchAssets(PROJECT_ID, token);
      setAssets(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddAsset(data: AssetCreate) {
    const token = await getToken();
    if (!token) return;
    try {
      await createAsset(PROJECT_ID, data, token);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return { assets, loading, error, handleAddAsset };
}
