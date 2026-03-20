"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import {
  CommissioningRecord,
  fetchCommissioning,
  createCommissioning,
} from "../models/commissioning";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useCommissioning() {
  const { getToken, userId } = useAuth();
  const [records, setRecords] = useState<CommissioningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const data = await fetchCommissioning(PROJECT_ID, token);
      setRecords(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddRecord(data: { name: string; assigned_to?: string }) {
    const token = await getToken();
    if (!token || !userId) return;
    try {
      await createCommissioning(PROJECT_ID, { ...data, created_by: userId }, token);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return { records, loading, error, handleAddRecord };
}
