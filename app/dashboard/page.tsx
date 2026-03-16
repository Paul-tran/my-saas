"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getSupabase } from "../../lib/supabase";

export default function Dashboard() {
  const [docCount, setDocCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [inspectionCount, setInspectionCount] = useState(0);

  useEffect(() => {
async function fetchStats() {
  const client = getSupabase();
  
  const { data: docs } = await client.from("documents").select("*");
  const { data: assets } = await client.from("assets").select("*");
  const { data: inspections } = await client
    .from("commissioning")
    .select("*")
    .eq("status", "Pending");

  setDocCount(docs?.length || 0);
  setAssetCount(assets?.length || 0);
  setInspectionCount(inspections?.length || 0);
}
fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active="dashboard" />

      <main className="flex-1 px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome to ConstructIQ</h2>
        <p className="mt-2 text-gray-500">Here's an overview of your projects.</p>

        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Documents</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{docCount}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Active Assets</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{assetCount}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Open Inspections</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{inspectionCount}</p>
          </div>
        </div>
      </main>
    </div>
  );
}