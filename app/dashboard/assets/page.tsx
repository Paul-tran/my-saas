"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../../lib/supabase";

type Asset = {
  id: number;
  name: string;
  type: string;
  status: string;
  location: string;
  created_at: string;
};

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("Active");
  const [location, setLocation] = useState("");

  async function fetchAssets() {
    const { data, error } = await supabase.from("assets").select("*");
    if (!error && data) setAssets(data);
  }

  useEffect(() => {
    fetchAssets();
  }, []);

  async function handleAddAsset() {
    if (!name) return;
    await supabase.from("assets").insert({ name, type, status, location });
    setName("");
    setType("");
    setStatus("Active");
    setLocation("");
    setShowForm(false);
    await fetchAssets();
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

        {showForm && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm max-w-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">New Asset</h3>
            <div className="flex flex-col gap-4">
              <input
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                placeholder="Asset name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                placeholder="Type (e.g. Vehicle, Equipment)"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
              <input
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <select
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Under Maintenance</option>
              </select>
              <button
                onClick={handleAddAsset}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Save Asset
              </button>
            </div>
          </div>
        )}

        {assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-24 text-center">
            <p className="text-5xl">🏗️</p>
            <h3 className="mt-4 text-lg font-bold text-gray-800">No assets yet</h3>
            <p className="mt-2 text-gray-500">Add your first asset to get started.</p>
          </div>
        ) : (
          <div className="mt-8 bg-white rounded-xl shadow-sm">
            <div className="grid grid-cols-4 px-6 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase">
              <span>Name</span>
              <span>Type</span>
              <span>Location</span>
              <span>Status</span>
            </div>
            {assets.map((asset) => (
              <div key={asset.id} className="grid grid-cols-4 px-6 py-4 border-b border-gray-100">
                <span className="text-gray-800 font-medium">{asset.name}</span>
                <span className="text-gray-500">{asset.type}</span>
                <span className="text-gray-500">{asset.location}</span>
                <span className={`text-sm font-medium ${asset.status === "Active" ? "text-green-600" : asset.status === "Inactive" ? "text-red-500" : "text-yellow-500"}`}>
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
