"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import ErrorBanner from "../../components/ErrorBanner";
import { useAssets } from "../../../lib/hooks/useAssets";

const STATUS_COLOR: Record<string, string> = {
  active: "text-green-600",
  inactive: "text-red-500",
  maintenance: "text-yellow-500",
};

export default function Assets() {
  const { assets, loading, error, handleAddAsset } = useAssets();
  const [showForm, setShowForm] = useState(false);
  const [tag, setTag] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("active");
  const [siteId, setSiteId] = useState("1");

  async function handleSubmit() {
    if (!tag) return;
    await handleAddAsset({ tag, name, type, status, site_id: Number(siteId) });
    setTag("");
    setName("");
    setType("");
    setStatus("active");
    setShowForm(false);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active="assets" />

      <main className="flex-1 px-8 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Asset
          </button>
        </div>

        {error && <ErrorBanner message={error} />}

        {showForm && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm max-w-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">New Asset</h3>
            <div className="flex flex-col gap-4">
              <input
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                placeholder="Tag (unique ID, e.g. PUMP-001)"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
              <input
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                placeholder="Asset name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                placeholder="Type (e.g. Pump, Valve, Motor)"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
              <input
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                placeholder="Site ID"
                type="number"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              />
              <select
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Save Asset
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center mt-24">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-24 text-center">
            <p className="text-5xl">🏗️</p>
            <h3 className="mt-4 text-lg font-bold text-gray-800">No assets yet</h3>
            <p className="mt-2 text-gray-500">Add your first asset to get started.</p>
          </div>
        ) : (
          <div className="mt-8 bg-white rounded-xl shadow-sm">
            <div className="grid grid-cols-4 px-6 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase">
              <span>Tag</span>
              <span>Name / Type</span>
              <span>Commissioning</span>
              <span>Status</span>
            </div>
            {assets.map((asset) => (
              <div key={asset.id} className="grid grid-cols-4 px-6 py-4 border-b border-gray-100">
                <span className="text-gray-800 font-medium">{asset.tag}</span>
                <span className="text-gray-500">{asset.name || asset.type || "—"}</span>
                <span className="text-gray-500 capitalize">
                  {asset.commissioning_status.replace("_", " ")}
                </span>
                <span className={`text-sm font-medium capitalize ${STATUS_COLOR[asset.status] || "text-gray-500"}`}>
                  {asset.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
