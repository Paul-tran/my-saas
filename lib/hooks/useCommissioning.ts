"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CommissioningRecord,
  fetchCommissioning,
  createCommissioning,
} from "../models/commissioning";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useCommissioning() {
  
  const [records, setRecords] = useState<CommissioningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchCommissioning(PROJECT_ID, "");
      setRecords(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddRecord(data: { name: string; assigned_to?: string }) {
    try {
      await createCommissioning(PROJECT_ID, { ...data, created_by: "me" }, "");
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return { records, loading, error, handleAddRecord };
}
