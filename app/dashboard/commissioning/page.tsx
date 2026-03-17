"use client";

export const dynamic = "force-dynamic";


import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { getSupabase } from "../../../lib/supabase";

type Inspection = {
  id: number;
  title: string;
  status: string;
  assigned_to: string;
  due_date: string;
  created_at: string;
};

export default function Commissioning() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Pending");

  async function fetchInspections() {
    const { data, error } = await getSupabase().from("commissioning").select("*");
    if (!error && data) setInspections(data);
  }

  useEffect(() => {
    fetchInspections();
  }, []);

  async function handleAddInspection() {
    if (!title) return;
    await getSupabase().from("commissioning").insert({
      title,
      assigned_to: assignedTo,
      due_date: dueDate,
      status,
    });
    setTitle("");
    setAssignedTo("");
    setDueDate("");
    setStatus("Pending");
    setShowForm(false);
    await fetchInspections();
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

        {showForm && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm max-w-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">New Inspection</h3>
            <div className="flex flex-col gap-4">
              <input
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                placeholder="Inspection title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                placeholder="Assigned to"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <select
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Failed</option>
              </select>
              <button
                onClick={handleAddInspection}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Save Inspection
              </button>
            </div>
          </div>
        )}

        {inspections.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-24 text-center">
            <p className="text-5xl">✅</p>
            <h3 className="mt-4 text-lg font-bold text-gray-800">No inspections yet</h3>
            <p className="mt-2 text-gray-500">Add your first inspection to get started.</p>
          </div>
        ) : (
          <div className="mt-8 bg-white rounded-xl shadow-sm">
            <div className="grid grid-cols-4 px-6 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase">
              <span>Title</span>
              <span>Assigned To</span>
              <span>Due Date</span>
              <span>Status</span>
            </div>
            {inspections.map((inspection) => (
              <div key={inspection.id} className="grid grid-cols-4 px-6 py-4 border-b border-gray-100">
                <span className="text-gray-800 font-medium">{inspection.title}</span>
                <span className="text-gray-500">{inspection.assigned_to}</span>
                <span className="text-gray-500">{inspection.due_date}</span>
                <span className={`text-sm font-medium ${
                  inspection.status === "Completed" ? "text-green-600" :
                  inspection.status === "In Progress" ? "text-blue-500" :
                  inspection.status === "Failed" ? "text-red-500" :
                  "text-yellow-500"
                }`}>
                  {inspection.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
