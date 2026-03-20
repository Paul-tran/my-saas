"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { fetchDocuments } from "../models/documents";
import { fetchAssets } from "../models/assets";
import { fetchCommissioning } from "../models/commissioning";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useDashboard() {
  const { getToken } = useAuth();
  const [docCount, setDocCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [inspectionCount, setInspectionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) return;

      const [docs, assets, records] = await Promise.all([
        fetchDocuments(PROJECT_ID, token),
        fetchAssets(PROJECT_ID, token),
        fetchCommissioning(PROJECT_ID, token),
      ]);

      setDocCount(docs.length);
      setAssetCount(assets.filter((a) => a.status === "active").length);
      setInspectionCount(records.filter((r) => r.overall_status === "not_started").length);
      setLoading(false);
    }

    load();
  }, []);

  return { docCount, assetCount, inspectionCount, loading };
}
