"use client";

import { useState, useEffect } from "react";
import { fetchDocuments } from "../models/documents";
import { fetchAssets } from "../models/assets";
import { fetchCommissioning } from "../models/commissioning";

const PROJECT_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID || 1);

export function useDashboard() {
  const [docCount, setDocCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [inspectionCount, setInspectionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {

      const [docs, assets, records] = await Promise.all([
        fetchDocuments(PROJECT_ID, ""),
        fetchAssets(PROJECT_ID, ""),
        fetchCommissioning(PROJECT_ID, ""),
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
