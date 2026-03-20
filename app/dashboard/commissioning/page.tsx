"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import ErrorBanner from "../../components/ErrorBanner";
import { useCommissioning } from "../../../lib/hooks/useCommissioning";
import { STATUS_LABELS } from "../../../lib/models/commissioning";

const STATUS_COLOR: Record<string, string> = {
  not_started: "text-yellow-500",
  in_progress: "text-blue-500",
  completed: "text-green-600",
  failed: "text-red-500",
};

export default function Commissioning() {
  const { records, loading, error, handleAddRecord } = useCommissioning();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  async function handleSubmit() {
    if (!name) return;
    await handleAddRecord({ name, assigned_to: assignedTo });
    setName("");
    setAssignedTo("");
    setShowForm(false);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active="commissioning" />

      <main className="flex-1 px-8 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Commissioning</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Inspection
          </button>
        </div>

        {error && <ErrorBanner message={error} />}

        {showForm && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm max-w-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">New Inspection</h3>
            <div className="flex flex-col gap-4">
              <input
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                placeholder="Inspection name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                placeholder="Assigned to (user ID)"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Save Inspection
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center mt-24">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-24 text-center">
            <p className="text-5xl">✅</p>
            <h3 className="mt-4 text-lg font-bold text-gray-800">No inspections yet</h3>
            <p className="mt-2 text-gray-500">Add your first inspection to get started.</p>
          </div>
        ) : (
          <div className="mt-8 bg-white rounded-xl shadow-sm">
            <div className="grid grid-cols-3 px-6 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase">
              <span>Name</span>
              <span>Assigned To</span>
              <span>Status</span>
            </div>
            {records.map((record) => (
              <div key={record.id} className="grid grid-cols-3 px-6 py-4 border-b border-gray-100">
                <span className="text-gray-800 font-medium">{record.name}</span>
                <span className="text-gray-500">{record.assigned_to || "—"}</span>
                <span className={`text-sm font-medium ${STATUS_COLOR[record.overall_status] || "text-gray-500"}`}>
                  {STATUS_LABELS[record.overall_status] || record.overall_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
